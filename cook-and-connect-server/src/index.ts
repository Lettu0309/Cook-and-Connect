import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; //File System
import multer from 'multer';
// Importamos el middleware de seguridad y la interfaz extendida
import { verifyToken, AuthRequest } from './middleware/auth'; 

// // Cargar variables de entorno del archivo .env
// dotenv.config();

// Configuración robusta de variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
// Usamos el puerto 3000, destinado para el servidor del proyecto
const port = process.env.SERVER_PORT || 3000;

// Añadimos 'as string' para asegurar a TypeScript que esto nunca será undefined.
const SECRET_KEY = (process.env.JWT_SECRET || 'secreto_temporal_inseguro') as string;

// --- CONFIGURACIÓN DE MULTER (ALMACENAMIENTO) ---
// 1. Aseguramos que la carpeta uploads exista
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. Definimos dónde y cómo guardar los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir) // Guardar en carpeta 'uploads'
  },
  filename: function (req, file, cb) {
    // Generamos un nombre único: timestamp + numero random + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// --- HACER PÚBLICA LA CARPETA UPLOADS ---
// Esto permite acceder a las fotos vía: http://localhost:3000/uploads/nombre_archivo.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- RUTA: REGISTRO DE USUARIO ---
// Usamos 'upload.single' porque el usuario puede subir su avatar al registrarse
app.post('/api/auth/register', upload.single('avatarFile'), async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, firstname, lastname, bio } = req.body;
    let avatarUrlToSave = null;

    try {
        // 1. Validaciones previas (Backend validation is crucial)
        if (!username || !email || !password || !firstname || !lastname) {
            res.status(400).json({ message: 'Faltan campos obligatorios' });
            return;
        }

        // 2. Verificar duplicados (Usuario o Correo)
        const [existing]: any = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?', 
            [email, username]
        );
        
        if (existing.length > 0) {
            res.status(409).json({ message: 'El usuario o el correo ya están registrados.' });
            return;
        }

        // 3. Procesar Avatar (Si se subió)
        if (req.file) {
            avatarUrlToSave = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        // 4. ENCRIPTAR CONTRASEÑA (Hashing)
        // Usamos salt 10. Esto convierte "123456" en algo como "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 5. Insertar en Base de Datos
        const [result]: any = await pool.query(
            'INSERT INTO users (username, email, password_hash, firstname, lastname, bio, avatar_url, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, firstname, lastname, bio || '', avatarUrlToSave, 'user', 'active']
        );

        const newUserId = result.insertId;

        // 6. Auto-Login: Generar Token inmediatamente para que no tenga que loguearse después
        const token = jwt.sign(
            { id: newUserId, role: 'user', username: username }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        // 7. Responder con éxito y datos de sesión
        res.status(201).json({ 
            message: 'Usuario registrado con éxito',
            token,
            user: {
                id: newUserId,
                username,
                email,
                firstname,
                lastname,
                bio: bio || '',
                avatar: avatarUrlToSave,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

// --- RUTA DE LOGIN ---
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario por email en la base de datos
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // Si no se encuentra el usuario
    if (rows.length === 0) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const user = rows[0];

    // 2. Verificar si el usuario está baneado
    if (user.status === 'banned') {
       res.status(403).json({ message: 'Tu cuenta ha sido suspendida' });
       return;
    }

    // 3. Comparar contraseñas
    let isMatch = false;
    // if (user.password_hash.startsWith('$2')) {
    //     // Es un hash de bcrypt real
        isMatch = await bcrypt.compare(password, user.password_hash);
    // } else {
    //     // Es texto plano (solo para desarrollo)
    //     isMatch = password === user.password_hash;
    // }

    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // 4. Generar Token JWT
    // Ahora SECRET_KEY ya no dará error porque TypeScript sabe que es un string
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );

    // 5. Responder al cliente
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        avatar: user.avatar_url,
        firstname: user.firstname,  //Importante para el perfil
        lastname: user.lastname,    //Importante para el perfil
        bio: user.bio,              //Importante para el perfil
        role: user.role
      } 
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno en el servidor' });
  }
});

// --- VERIFICAR DISPONIBILIDAD DE USERNAME (HÍBRIDO) ---
// Quitamos 'verifyToken' de los argumentos, lo haremos manual adentro
app.get('/api/user/check-username', async (req: Request, res: Response): Promise<void> => {
    const { username } = req.query;
    let currentUserId = -1; // Valor por defecto (ID imposible)

    // 1. INTENTO DE LEER TOKEN MANUALMENTE
    // Esto permite que EditProfilePage siga funcionando correctamente
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            // Verificamos el token sin el middleware para no bloquear si falla
            const verified: any = jwt.verify(token, SECRET_KEY);
            currentUserId = verified.id;
        } catch (e) {
            // Si el token es inválido o no existe (caso Registro), ignoramos y seguimos
        }
    }

    if (!username || typeof username !== 'string') {
        res.status(400).json({ message: 'Username requerido' });
        return;
    }

    try {
        // 2. CONSULTA INTELIGENTE
        // Si currentUserId es -1 (Registro), busca si ALGUIEN lo tiene.
        // Si currentUserId es un ID real (Edición), busca si ALGUIEN MÁS (id !=) lo tiene.
        const [rows]: any = await pool.query(
            'SELECT id FROM users WHERE username = ? AND id != ?', 
            [username, currentUserId]
        );
        
        const isAvailable = rows.length === 0;
        res.json({ available: isAvailable });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verificando usuario' });
    }
});

// --- NUEVA RUTA: ACTUALIZAR PERFIL ---
// Protegida por el middleware 'verifyToken'
app.put('/api/user/profile', verifyToken, upload.single('avatarFile') , async (req: AuthRequest, res: Response): Promise<void> => {
    // Nota: Cuando usas multer, los campos de texto están en req.body y el archivo en req.file
    // Obtenemos los datos que envía el formulario
    const { firstname, lastname, bio, username, removeAvatar } = req.body;
    
    // Obtenemos el ID del usuario desde el token (seguro)
    // El middleware 'verifyToken' ya llenó req.user por nosotros
    const userId = req.user.id; 

    try {
        // 1. Determinar la URL final del avatar
        let avatarUrlToSave = undefined;

        if (req.file) {
          // Si subieron un archivo nuevo, construimos su URL completa
          avatarUrlToSave = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (removeAvatar === 'true') {
            // Si el usuario pidió borrar la foto
            avatarUrlToSave = null;
        }

        // // Actualizamos la base de datos
        // await pool.query(
        //     'UPDATE users SET firstname = ?, lastname = ?, bio = ?, avatar_url = ?, username = ? WHERE id = ?',
        //     [firstname, lastname, bio, avatar_url, username, userId]
        // );

        // 2. Construcción Dinámica de la consulta SQL
        // Solo actualizamos el avatar si cambió (es decir, si avatarUrlToSave no es undefined)
        let query = 'UPDATE users SET firstname = ?, lastname = ?, bio = ?, username = ?';
        const params = [firstname, lastname, bio, username];

        if (avatarUrlToSave !== undefined) {
            query += ', avatar_url = ?';
            params.push(avatarUrlToSave);
        }

        //Agregamos la condición WHERE con el id del usuario
        query += ' WHERE id = ?';
        params.push(userId);

        // 3. Ejecutar actualización
        await pool.query(query, params);

        // 4. Obtener el avatar final para responder al frontend
        // Si no lo cambiamos, tendríamos que buscar el viejo, pero para simplificar, 
        // asumimos que el frontend refresca o devolvemos lo que calculamos.
        // Haremos una consulta rápida para devolver el objeto usuario fresco y correcto.
        // Devolvemos los datos actualizados para que el frontend se refresque inmediatamente
        const [updatedRows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedRows[0];
        
        res.json({ 
            message: 'Perfil actualizado correctamente',
            user: { 
                id: userId, 
                firstname, 
                lastname, 
                bio,
                username,
                avatar: updatedUser.avatar_url
            }
        });

    } catch (error: any) {
        // Manejo específico del error de duplicados (Código 1062 en MySQL)
        // Esto es un respaldo por si dos personas cambian el nombre al mismo milisegundo
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
             return;
        }
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error al actualizar perfil en base de datos' });
    }
});

// --- RUTA: OBTENER CATEGORÍAS (Para el formulario) ---
app.get('/api/categories', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categorías' });
    }
});

// --- RUTA: CREAR RECETA (TRANSACCIONAL) ---
// upload.array('recipeImages', 5) permite subir hasta 5 fotos con ese nombre de campo
app.post('/api/recipes', verifyToken, upload.array('recipeImages', 5), async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user.id;
    // Nota: Al usar FormData, los arrays llegan como strings JSON o repetidos, hay que parsearlos
    const { title, description, prep_time_minutes, difficulty, ingredients, categories } = req.body;
    const files = req.files as Express.Multer.File[];

    // Iniciamos una conexión dedicada para la transacción
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // --- INICIO TRANSACCIÓN ---

        // 1. Insertar la Receta base
        const [recipeResult]: any = await connection.query(
            'INSERT INTO recipes (user_id, title, description, prep_time_minutes, difficulty) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, prep_time_minutes, difficulty]
        );
        const recipeId = recipeResult.insertId;

        // 2. Insertar Ingredientes (Vienen como string JSON desde el frontend)
        if (ingredients) {
            const ingredientsArray = JSON.parse(ingredients); // Ej: ["1kg Harina", "2 Huevos"]
            for (const item of ingredientsArray) {
                await connection.query(
                    'INSERT INTO recipe_ingredients (recipe_id, item) VALUES (?, ?)',
                    [recipeId, item]
                );
            }
        }

        // 3. Insertar Categorías (Relación Muchos a Muchos)
        if (categories) {
            const categoriesArray = JSON.parse(categories); // Ej: [1, 3] (IDs de categorías)
            for (const catId of categoriesArray) {
                await connection.query(
                    'INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)',
                    [recipeId, catId]
                );
            }
        }

        // 4. Insertar Imágenes
        if (files && files.length > 0) {
            let order = 0;
            for (const file of files) {
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                await connection.query(
                    'INSERT INTO recipe_images (recipe_id, image_url, display_order) VALUES (?, ?, ?)',
                    [recipeId, imageUrl, order++]
                );
            }
        }

        await connection.commit(); // --- ÉXITO: GUARDAR TODO ---
        
        res.status(201).json({ message: 'Receta publicada con éxito', recipeId });

    } catch (error) {
        await connection.rollback(); // --- ERROR: DESHACER TODO ---
        console.error('Error creando receta:', error);
        res.status(500).json({ message: 'Error al crear la receta' });
    } finally {
        connection.release(); // Liberar la conexión
    }
});

// --- RUTA: ELIMINAR RECETA ---
app.delete('/api/recipes/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // 1. Verificar que la receta exista y pertenezca al usuario
        const [rows]: any = await pool.query('SELECT user_id FROM recipes WHERE id = ?', [recipeId]);
        
        if (rows.length === 0) {
            res.status(404).json({ message: 'Receta no encontrada' });
            return;
        }

        // Solo el dueño o un admin pueden borrar
        if (rows[0].user_id !== userId && userRole !== 'admin') {
            res.status(403).json({ message: 'No tienes permiso para eliminar esta receta' });
            return;
        }

        // 2. Eliminar (El CASCADE de MySQL borrará imágenes, comentarios, likes, etc.)
        await pool.query('DELETE FROM recipes WHERE id = ?', [recipeId]);
        
        // (Opcional) Aquí podrías borrar físicamente los archivos de imagen del disco usando fs.unlink
        // pero por ahora confiaremos en la limpieza de DB.

        res.json({ message: 'Receta eliminada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la receta' });
    }
});

// --- RUTA: EDITAR RECETA (DATOS) ---
app.put('/api/recipes/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const recipeId = req.params.id;
    const userId = req.user.id;
    // Recibimos los datos básicos. (La edición de imágenes requiere lógica extra de multer que omitiremos por simplicidad inicial)
    const { title, description, prep_time_minutes, difficulty, ingredients, categories } = req.body;

    const connection = await pool.getConnection();

    try {
        // 1. Verificar propiedad
        const [rows]: any = await connection.query('SELECT user_id FROM recipes WHERE id = ?', [recipeId]);
        if (rows.length === 0) { res.status(404).json({ message: 'Receta no encontrada' }); return; }
        if (rows[0].user_id !== userId && req.user.role !== 'admin') { 
            res.status(403).json({ message: 'No autorizado' }); 
            return; 
        }

        await connection.beginTransaction();

        // 2. Actualizar Tabla Principal
        await connection.query(
            'UPDATE recipes SET title = ?, description = ?, prep_time_minutes = ?, difficulty = ?, is_edited = TRUE WHERE id = ?',
            [title, description, prep_time_minutes, difficulty, recipeId]
        );

        // 3. Actualizar Ingredientes (Estrategia: Borrar todos y reinsertar)
        if (ingredients) {
            await connection.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
            const ingredientsArray = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            for (const item of ingredientsArray) {
                if (item && item.trim() !== '') {
                    await connection.query('INSERT INTO recipe_ingredients (recipe_id, item) VALUES (?, ?)', [recipeId, item]);
                }
            }
        }

        // 4. Actualizar Categorías
        if (categories) {
            await connection.query('DELETE FROM recipe_categories WHERE recipe_id = ?', [recipeId]);
            const categoriesArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
            for (const catId of categoriesArray) {
                await connection.query('INSERT INTO recipe_categories (recipe_id, category_id) VALUES (?, ?)', [recipeId, catId]);
            }
        }

        await connection.commit();
        res.json({ message: 'Receta actualizada con éxito' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la receta' });
    } finally {
        connection.release();
    }
});

// --- RUTA: BÚSQUEDA AVANZADA Y FILTROS ---
app.get('/api/recipes/search', async (req: Request, res: Response): Promise<void> => {
    // Recibimos los filtros por query params (ej: ?q=pizza&difficulty=Fácil&categories=1,2)
    const { q, time, difficulty, categories } = req.query;
    
    // Identificación opcional para 'my_reaction'
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const verified: any = jwt.verify(token, SECRET_KEY);
            currentUserId = verified.id;
        } catch (e) {}
    }

    try {
        // Construcción Dinámica de la Query
        let sql = `
            SELECT DISTINCT
                r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at, r.is_edited,
                u.username, u.avatar_url as author_avatar,
                (SELECT image_url FROM recipe_images WHERE recipe_id = r.id ORDER BY display_order ASC LIMIT 1) as cover_image,
                (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
                (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
            WHERE 1=1
        `;
        
        const params: any[] = [currentUserId]; // El primer ? es para my_reaction

        // 1. Filtro de Texto (Nombre Receta O Nombre Usuario)
        if (q) {
            sql += ` AND (r.title LIKE ? OR u.username LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }

        // 2. Filtro de Tiempo
        if (time) {
            const now = new Date();
            if (time === 'week') {
                sql += ` AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)`;
            } else if (time === 'month') {
                sql += ` AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
            } else if (time === 'year') {
                sql += ` AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`;
            }
        }

        // 3. Filtro de Dificultad
        if (difficulty && difficulty !== 'Todas') {
            sql += ` AND r.difficulty = ?`;
            params.push(difficulty);
        }

        // 4. Filtro de Categorías (Múltiple)
        // Recibimos "1,2,3" y buscamos recetas que tengan ALGUNA de esas categorías
        if (categories) {
            const catsArray = (categories as string).split(',').map(id => parseInt(id));
            if (catsArray.length > 0) {
                // Truco SQL para array dinámico: category_id IN (?, ?, ?)
                const placeholders = catsArray.map(() => '?').join(',');
                sql += ` AND rc.category_id IN (${placeholders})`;
                params.push(...catsArray);
            }
        }

        sql += ` ORDER BY r.created_at DESC`;

        const [rows] = await pool.query(sql, params);
        res.json(rows);

    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ message: 'Error al buscar recetas' });
    }
});

// // --- RUTA: OBTENER FEED DE RECETAS ---
// // Esta ruta es PÚBLICA (no requiere verifyToken) para que los invitados también vean el feed
// app.get('/api/recipes', async (req: Request, res: Response) => {
//     try {
//         // Consulta Maestra:
//         // 1. Seleccionamos datos de la receta (r)
//         // 2. Unimos con el usuario (u) para obtener nombre y avatar
//         // 3. Subconsulta para obtener SOLO la primera imagen (cover_image)
//         // 4. Subconsultas para contar likes y comentarios
//         const query = `
//             SELECT 
//                 r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at,
//                 u.username, u.avatar_url as author_avatar,
//                 (SELECT image_url FROM recipe_images WHERE recipe_id = r.id ORDER BY display_order ASC LIMIT 1) as cover_image,
//                 (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
//                 (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count
//             FROM recipes r
//             JOIN users u ON r.user_id = u.id
//             ORDER BY r.created_at DESC
//         `;

//         const [rows] = await pool.query(query);
//         res.json(rows);

//     } catch (error) {
//         console.error('Error obteniendo feed:', error);
//         res.status(500).json({ message: 'Error al cargar las recetas' });
//     }
// });

// --- RUTA: OBTENER FEED DE RECETAS (MEJORADA) ---
// Ahora intenta leer el token (si existe) para saber si el usuario ya dio like
app.get('/api/recipes', async (req: Request, res: Response) => {
    try {
        // 1. Intentamos identificar al usuario opcionalmente
        let currentUserId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const verified: any = jwt.verify(token, SECRET_KEY);
                currentUserId = verified.id;
            } catch (e) {
                // Si el token es inválido, no pasa nada, lo tratamos como invitado
            }
        }

        // 2. Consulta Maestra con "my_reaction"
        const query = `
            SELECT 
                r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at, r.is_edited,
                u.username, u.avatar_url as author_avatar,
                (SELECT image_url FROM recipe_images WHERE recipe_id = r.id ORDER BY display_order ASC LIMIT 1) as cover_image,
                (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
                (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `;

        const [rows] = await pool.query(query, [currentUserId]);
        res.json(rows);

    } catch (error) {
        console.error('Error obteniendo feed:', error);
        res.status(500).json({ message: 'Error al cargar las recetas' });
    }
});

// --- RUTA: OBTENER MIS RECETAS (PERFIL PROPIO) ---
// Protegida con verifyToken porque necesitamos saber el ID del usuario
app.get('/api/user/recipes', verifyToken, async (req: AuthRequest, res: Response) => {
    const userId = req.user.id; // Obtenido del token

    try {
        const query = `
            SELECT 
                r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at, r.is_edited,
                u.username, u.avatar_url as author_avatar,
                (SELECT image_url FROM recipe_images WHERE recipe_id = r.id ORDER BY display_order ASC LIMIT 1) as cover_image,
                (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
                -- También queremos saber si yo mismo le di like a mi receta
                (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id = ?  -- FILTRO CLAVE: Solo mis recetas
            ORDER BY r.created_at DESC
        `;

        const [rows] = await pool.query(query, [userId, userId]);
        res.json(rows);

    } catch (error) {
        console.error('Error obteniendo mis recetas:', error);
        res.status(500).json({ message: 'Error al cargar tus recetas' });
    }
});

// --- RUTA: PERFIL PÚBLICO (INFO + RECETAS) ---
app.get('/api/users/:username', async (req: Request, res: Response): Promise<void> => {
    const targetUsername = req.params.username;
    
    // Identificación opcional del visitante (para saber 'my_reaction' en las recetas)
    let visitorId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const verified: any = jwt.verify(token, SECRET_KEY);
            visitorId = verified.id;
        } catch (e) {}
    }

    try {
        // 1. Obtener Datos del Usuario (Solo info pública)
        const [users]: any = await pool.query(
            'SELECT id, username, firstname, lastname, bio, avatar_url, created_at, role FROM users WHERE username = ?', 
            [targetUsername]
        );

        if (users.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const profileUser = users[0];

        // 2. Obtener sus Recetas (Reutilizamos la lógica del feed pero filtrada por su ID)
        const queryRecipes = `
            SELECT 
                r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at, r.is_edited,
                u.username, u.avatar_url as author_avatar,
                (SELECT image_url FROM recipe_images WHERE recipe_id = r.id ORDER BY display_order ASC LIMIT 1) as cover_image,
                (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
                (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `;

        const [recipes] = await pool.query(queryRecipes, [visitorId, profileUser.id]);

        res.json({
            profile: profileUser,
            recipes: recipes
        });

    } catch (error) {
        console.error('Error perfil público:', error);
        res.status(500).json({ message: 'Error al cargar perfil' });
    }
});

// --- RUTA: OBTENER DETALLES DE UNA RECETA (PÚBLICA) ---
// app.get('/api/recipes/:id', async (req: Request, res: Response): Promise<void> => {
//     const recipeId = req.params.id;
    
//     // Identificación opcional (para saber si ya le diste like)
//     let currentUserId = null;
//     const authHeader = req.headers['authorization'];
//     if (authHeader) {
//         try {
//             const token = authHeader.split(' ')[1];
//             const verified: any = jwt.verify(token, SECRET_KEY);
//             currentUserId = verified.id;
//         } catch (e) {}
//     }

//     try {
//         // 1. Datos principales de la receta
//         const queryRecipe = `
//             SELECT 
//                 r.id, r.title, r.description, r.prep_time_minutes, r.difficulty, r.created_at,
//                 u.username, u.avatar_url as author_avatar,
//                 (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
//                 (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
//                 (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
//             FROM recipes r
//             JOIN users u ON r.user_id = u.id
//             WHERE r.id = ?
//         `;
//         const [rows]: any = await pool.query(queryRecipe, [currentUserId, recipeId]);

//         if (rows.length === 0) {
//             res.status(404).json({ message: 'Receta no encontrada' });
//             return;
//         }
//         const recipe = rows[0];

//         // 2. Obtener Ingredientes
//         const [ingredients]: any = await pool.query('SELECT item FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
        
//         // 3. Obtener Categorías
//         const [categories]: any = await pool.query(`
//             SELECT c.name FROM categories c
//             JOIN recipe_categories rc ON c.id = rc.category_id
//             WHERE rc.recipe_id = ?
//         `, [recipeId]);

//         // 4. Obtener TODAS las Imágenes (ordenadas)
//         const [images]: any = await pool.query('SELECT image_url FROM recipe_images WHERE recipe_id = ? ORDER BY display_order ASC', [recipeId]);

//         // 5. Obtener Comentarios (con datos del autor)
//         const [comments]: any = await pool.query(`
//             SELECT c.id, c.content, c.created_at, u.username, u.avatar_url 
//             FROM comments c
//             JOIN users u ON c.user_id = u.id
//             WHERE c.recipe_id = ?
//             ORDER BY c.created_at DESC
//         `, [recipeId]);

//         // Armamos el objeto final limpio
//         const fullRecipe = {
//             ...recipe,
//             ingredients: ingredients.map((i: any) => i.item),
//             categories: categories.map((c: any) => c.name),
//             images: images.map((img: any) => img.image_url),
//             comments: comments
//         };

//         res.json(fullRecipe);

//     } catch (error) {
//         console.error('Error obteniendo detalles:', error);
//         res.status(500).json({ message: 'Error al cargar la receta' });
//     }
// });

app.get('/api/recipes/:id', async (req: Request, res: Response): Promise<void> => {
    const recipeId = req.params.id;
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    
    // Extracción segura del token
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const verified: any = jwt.verify(token, SECRET_KEY);
            currentUserId = verified.id;
        } catch (e) {
            // Token inválido -> Invitado
        }
    }

    try {
        // 1. Receta
        const queryRecipe = `
            SELECT r.*, u.username, u.avatar_url as author_avatar,
            (SELECT COUNT(*) FROM recipe_reactions WHERE recipe_id = r.id AND reaction_type = 'like') as likes_count,
            (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count,
            (SELECT reaction_type FROM recipe_reactions WHERE recipe_id = r.id AND user_id = ?) as my_reaction
            FROM recipes r JOIN users u ON r.user_id = u.id WHERE r.id = ?
        `;
        // IMPORTANTE: Pasamos 'currentUserId || null' para asegurar que SQL reciba NULL si no hay usuario
        const [rows]: any = await pool.query(queryRecipe, [currentUserId || null, recipeId]);
        
        if (rows.length === 0) { res.status(404).json({ message: 'No encontrado' }); return; }
        const recipe = rows[0];

        const [ingredients]: any = await pool.query('SELECT item FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
        const [categories]: any = await pool.query('SELECT c.name FROM categories c JOIN recipe_categories rc ON c.id = rc.category_id WHERE rc.recipe_id = ?', [recipeId]);
        const [images]: any = await pool.query('SELECT image_url FROM recipe_images WHERE recipe_id = ? ORDER BY display_order ASC', [recipeId]);

        // 2. Comentarios (CORRECCIÓN CLAVE AQUÍ)
        const [commentsRaw]: any = await pool.query(`
            SELECT 
                c.id, c.content, c.created_at, u.username, u.avatar_url,
                (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id AND reaction_type = 'like') as likes_count,
                (SELECT reaction_type FROM comment_reactions WHERE comment_id = c.id AND user_id = ?) as my_reaction
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.recipe_id = ?
            ORDER BY c.created_at DESC
        `, [currentUserId || null, recipeId]);

        // LIMPIEZA DE DATOS: Convertimos likes_count a Number explícitamente para evitar "NaN" en frontend
        const comments = commentsRaw.map((c: any) => ({
            ...c,
            likes_count: Number(c.likes_count) || 0 // Si viene string o null, lo fuerza a número
        }));

        const fullRecipe = {
            ...recipe,
            ingredients: ingredients.map((i: any) => i.item),
            categories: categories.map((c: any) => c.name),
            images: images.map((img: any) => img.image_url),
            comments: comments
        };
        res.json(fullRecipe);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Error' }); 
    }
});

// --- NUEVA RUTA: REACCIONAR (TOGGLE LIKE) ---
// Protegida: Solo usuarios logueados pueden reaccionar
app.post('/api/recipes/:id/react', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const { type } = req.body; // Esperamos { type: 'like' }

    // Validamos que sea un tipo permitido
    if (type !== 'like' && type !== 'dislike') {
        res.status(400).json({ message: 'Tipo de reacción inválido' });
        return;
    }

    try {
        // 1. Verificar si ya existe una reacción
        const [existing]: any = await pool.query(
            'SELECT reaction_type FROM recipe_reactions WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );

        let action = '';

        if (existing.length > 0) {
            // YA EXISTE REACCIÓN
            if (existing[0].reaction_type === type) {
                // A. Es la misma (ej: Like sobre Like) -> QUITAR (Toggle OFF)
                await pool.query(
                    'DELETE FROM recipe_reactions WHERE user_id = ? AND recipe_id = ?',
                    [userId, recipeId]
                );
                action = 'removed';
            } else {
                // B. Es diferente (ej: Cambiar Like por Dislike) -> ACTUALIZAR
                await pool.query(
                    'UPDATE recipe_reactions SET reaction_type = ? WHERE user_id = ? AND recipe_id = ?',
                    [type, userId, recipeId]
                );
                action = 'updated';
            }
        } else {
            // NO EXISTE -> INSERTAR (Toggle ON)
            await pool.query(
                'INSERT INTO recipe_reactions (user_id, recipe_id, reaction_type) VALUES (?, ?, ?)',
                [userId, recipeId, type]
            );
            action = 'added';
        }

        // 2. Obtener el nuevo conteo para actualizar el frontend
        const [countResult]: any = await pool.query(
            "SELECT COUNT(*) as count FROM recipe_reactions WHERE recipe_id = ? AND reaction_type = 'like'",
            [recipeId]
        );

        res.json({ 
            message: 'Reacción actualizada', 
            action, 
            newLikesCount: countResult[0].count 
        });

    } catch (error) {
        console.error('Error en reacción:', error);
        res.status(500).json({ message: 'Error al procesar la reacción' });
    }
});

// --- RUTAS DE COMENTARIOS ---

// 1. PUBLICAR COMENTARIO
app.post('/api/recipes/:id/comments', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        res.status(400).json({ message: 'El comentario no puede estar vacío' });
        return;
    }

    try {
        await pool.query(
            'INSERT INTO comments (recipe_id, user_id, content) VALUES (?, ?, ?)',
            [recipeId, userId, content]
        );
        
        // Devolvemos éxito
        res.status(201).json({ message: 'Comentario publicado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al publicar comentario' });
    }
});

// 2. ELIMINAR COMENTARIO
app.delete('/api/comments/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const commentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Verificar que el comentario exista y pertenezca al usuario (o sea admin)
        const [rows]: any = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        
        if (rows.length === 0) {
            res.status(404).json({ message: 'Comentario no encontrado' });
            return;
        }

        if (rows[0].user_id !== userId && userRole !== 'admin') {
            res.status(403).json({ message: 'No tienes permiso para eliminar este comentario' });
            return;
        }

        await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comentario eliminado' });

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
});

// 3. EDITAR COMENTARIO (Opcional, pero pedido)
app.put('/api/comments/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const commentId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        res.status(400).json({ message: 'Contenido vacío' });
        return;
    }

    try {
        // Verificar propiedad
        const [rows]: any = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        
        if (rows.length === 0 || rows[0].user_id !== userId) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }

        await pool.query('UPDATE comments SET content = ? WHERE id = ?', [content, commentId]);
        res.json({ message: 'Comentario actualizado' });

    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar' });
    }
});

// --- NUEVA RUTA: REACCIONAR A COMENTARIO ---
app.post('/api/comments/:id/react', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
    const commentId = req.params.id;
    const userId = req.user.id;
    const { type } = req.body; // 'like'

    try {
        const [existing]: any = await pool.query('SELECT reaction_type FROM comment_reactions WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
        
        if (existing.length > 0) {
            if (existing[0].reaction_type === type) {
                await pool.query('DELETE FROM comment_reactions WHERE user_id = ? AND comment_id = ?', [userId, commentId]);
            } else {
                await pool.query('UPDATE comment_reactions SET reaction_type = ? WHERE user_id = ? AND comment_id = ?', [type, userId, commentId]);
            }
        } else {
            await pool.query('INSERT INTO comment_reactions (user_id, comment_id, reaction_type) VALUES (?, ?, ?)', [userId, commentId, type]);
        }

        const [countResult]: any = await pool.query("SELECT COUNT(*) as count FROM comment_reactions WHERE comment_id = ? AND reaction_type = 'like'", [commentId]);
        res.json({ newLikesCount: countResult[0].count });
    } catch (error) {
        res.status(500).json({ message: 'Error en reacción' });
    }
});

// Ruta básica de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('¡Hola! El servidor de Cook & Connect está vivo y funcionando 🔥');
});

// Arrancar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});