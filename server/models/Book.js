import mongoose from "mongoose";
const { Schema } = mongoose;

const bookSchema = new Schema({
  titulo: {
    type: String,
    required: [true, 'O título do livro é obrigatório'],
    trim: true,
    index: true
  },
  autor: {
    type: [String],
    required: [true, 'Pelo menos um autor é obrigatório']
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  editora: {
    type: String,
    trim: true
  },
  anoPublicacao: {
    type: Number,
    min: [1000, 'Ano inválido'],
    max: [new Date().getFullYear() + 1, 'Ano não pode ser no futuro distante']
  },
  genero: {
    type: [String],
    default: []
  },
  numeroPaginas: {
    type: Number,
    min: 1
  },
  sinopse: {
    type: String,
    maxlength: [2000, 'A sinopse não pode ter mais de 2000 caracteres']
  },
  capaUrl: {
    type: String,
    default: ''
  },
  anoLeitura: {
    type: Number,
    required: [true, 'O ano de leitura é obrigatório']
  },
  status: {
    type: String,
    enum: ['Quero Ler', 'Lendo', 'Lido', 'Abandonado'],
    default: 'Quero Ler'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  nota: {
    type: Number,
    min: 0,
    max: 10
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Book', bookSchema);
