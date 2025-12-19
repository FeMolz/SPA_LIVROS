import Book from '../models/Book.js'
import mongoose from 'mongoose';

const bookController = {

    // POST
    criar: async (req, res) => {
        try {
            const newBook = await Book.create(req.body);
            res.status(201).json(newBook);
        } catch (error) {
            res.status(400).json({ mensagem: "Erro ao cadastrar livro", erro: error.message });
        }
    },

    // GET
    listar: async (req, res) => {
        try {
            const getBooks = await Book.find().sort({ createdAt: -1 })

            res.status(200).json(getBooks)
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao buscar livros", erro: error.message })
        }
    },

    // GET
    buscarPorId: async (req, res) => {
        try {
            const getBooksById = await Book.findById(req.params.id);

            if (!getBooksById) {
                return res.status(404).json({ mensagem: "Livro não encontrado" });
            }

            res.status(200).json(getBooksById)
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao buscar livros", erro: error.message })
        }
    },

    // PUT/ PATCH
    atualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const updatedBook = await Book.findByIdAndUpdate(id, req.body, {
                new: true,
                runValidators: true
            });

            if (!updatedBook) {
                return res.status(404).json({ mensagem: "Livro não encontrado para atualizar" })
            }

            res.status(200).json(updatedBook);
        } catch (error) {
            res.status(400).json({ mensagem: "Erro ao atualizar livro", erro: error.message })
        }
    },


    // DELETE
    deletar: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ mensagem: "ID inválido" });
            }

            const deletedBook = await Book.findByIdAndDelete(id);

            if (!deletedBook) {
                return res.status(404).json({ mensagem: "Livro não encontrado para exclusão" })
            }

            res.status(200).json({ mensagem: "Livro excluído com sucesso", Book: deletedBook });
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao deletar livro", erro: error.message });
        }
    }
};

export default bookController;