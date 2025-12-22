import Book from '../models/Book.js'
import mongoose from 'mongoose';

const bookController = {

    // POST
    criar: async (req, res) => {
        try {
            const newBook = await Book.create({ ...req.body, user: req.user._id });
            res.status(201).json(newBook);
        } catch (error) {
            res.status(400).json({ mensagem: "Erro ao cadastrar livro", erro: error.message });
        }
    },

    // GET
    listar: async (req, res) => {
        try {
            const getBooks = await Book.find({ user: req.user._id }).sort({ createdAt: -1 })

            res.status(200).json(getBooks)
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao buscar livros", erro: error.message })
        }
    },

    // GET
    buscarPorId: async (req, res) => {
        try {
            const getBooksById = await Book.findOne({ _id: req.params.id, user: req.user._id });

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
            const updatedBook = await Book.findOneAndUpdate({ _id: id, user: req.user._id }, req.body, {
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

            const deletedBook = await Book.findOneAndDelete({ _id: id, user: req.user._id });

            if (!deletedBook) {
                return res.status(404).json({ mensagem: "Livro não encontrado para exclusão" })
            }

            res.status(200).json({ mensagem: "Livro excluído com sucesso", Book: deletedBook });
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao deletar livro", erro: error.message });
        }
    },

    // REORDER (Batch Update)
    reorderBooks: async (req, res) => {
        try {
            const { updates } = req.body; // Expecting [{ id: '...', order: 1 }, { id: '...', order: 2 }]

            if (!Array.isArray(updates)) {
                return res.status(400).json({ mensagem: "Formato inválido para reordenação" });
            }

            const bulkOps = updates.map(update => ({
                updateOne: {
                    filter: { _id: update.id, user: req.user._id },
                    update: { order: update.order }
                }
            }));

            await Book.bulkWrite(bulkOps);

            res.status(200).json({ mensagem: "Ordem atualizada com sucesso" });
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao reordenar livros", erro: error.message });
        }
    },

    // UPDATE YEAR Name
    updateYear: async (req, res) => {
        try {
            const { year } = req.params;
            const { newYear } = req.body;

            if (!year || !newYear) {
                console.log("UpdateYear Failed: Missing fields", { year, newYear });
                return res.status(400).json({ mensagem: "Ano atual e novo ano são obrigatórios" });
            }

            console.log(`UpdateYear: Updating ${year} to ${newYear} for user ${req.user._id}`);

            const result = await Book.updateMany(
                { anoLeitura: Number(year), user: req.user._id },
                { $set: { anoLeitura: Number(newYear) } }
            );

            res.status(200).json({ mensagem: "Ano atualizado com sucesso", result });
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao atualizar ano", erro: error.message });
        }
    },

    // DELETE YEAR (Delete all books in Year)
    deleteBooksByYear: async (req, res) => {
        try {
            const { year } = req.params;

            if (!year) {
                return res.status(400).json({ mensagem: "Ano é obrigatório" });
            }

            const result = await Book.deleteMany({ anoLeitura: year, user: req.user._id });

            res.status(200).json({ mensagem: "Livros do ano excluídos com sucesso", result });
        } catch (error) {
            res.status(500).json({ mensagem: "Erro ao excluir livros do ano", erro: error.message });
        }
    }
};

export default bookController;