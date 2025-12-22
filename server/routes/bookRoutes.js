import express from 'express';
import bookController from '../controllers/bookController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

// Rotas existentes
router.post('/', authMiddleware, bookController.criar);
router.get('/', authMiddleware, bookController.listar);
router.get('/:id', authMiddleware, bookController.buscarPorId);
router.put('/:id', authMiddleware, bookController.atualizar);
router.delete('/:id', authMiddleware, bookController.deletar);

// Novas rotas
router.put('/reorder/all', authMiddleware, bookController.reorderBooks);
router.put('/year/:year', authMiddleware, bookController.updateYear);
router.delete('/year/:year', authMiddleware, bookController.deleteBooksByYear);

export default router;