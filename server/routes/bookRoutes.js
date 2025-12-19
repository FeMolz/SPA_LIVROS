import express from 'express';
import bookController from '../controllers/bookController.js';

const router = express.Router()

router.post('/', bookController.criar)
router.get('/', bookController.listar)
router.get('/:id', bookController.buscarPorId)
router.put('/:id', bookController.atualizar)
router.delete('/:id', bookController.deletar)

export default router;