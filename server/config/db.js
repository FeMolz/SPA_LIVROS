import mongoose from "mongoose";

export async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao MongoDB com sucesso!");
    } catch (err) {
        console.error("Não foi possível conectar ao MongoDB:");
        console.error(err.message);
        process.exit(1);
    }
}
