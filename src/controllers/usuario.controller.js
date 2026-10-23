const prisma = require("../data/prisma");
const bcrypt = require("bcrypt");

const cadastrar = async (req, res) => {
    try {
        const { nome, email, senha, ...outrosDados } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Nome, e-mail e senha são obrigatórios."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const existente = await prisma.usuario.findUnique({
            where: { email: emailNormalizado }
        });

        if (existente) {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const item = await prisma.usuario.create({
            data: {
                ...outrosDados,
                nome: nome.trim(),
                email: emailNormalizado,
                senha: senhaHash
            },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso!",
            cadastrado: item
        });
    } catch (erro) {
        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao cadastrar usuário."
        });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        return res.status(200).json(lista);
    } catch (erro) {
        console.error("Erro ao listar usuários:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao listar usuários."
        });
    }
};

const buscar = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        const item = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        if (!item) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json(item);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao buscar usuário."
        });
    }
};

const atualizar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const dados = { ...req.body };

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        // Não permite alterar o ID nem campos não enviados para atualização.
        delete dados.id;

        if (dados.senha !== undefined) {
            if (typeof dados.senha !== "string" || dados.senha.length < 8) {
                return res.status(400).json({
                    mensagem: "A senha deve ter pelo menos 8 caracteres."
                });
            }

            dados.senha = await bcrypt.hash(dados.senha, 10);
        }

        if (dados.email !== undefined) {
            if (typeof dados.email !== "string" || !dados.email.trim()) {
                return res.status(400).json({
                    mensagem: "Informe um e-mail válido."
                });
            }

            dados.email = dados.email.trim().toLowerCase();

            const emailExistente = await prisma.usuario.findFirst({
                where: {
                    email: dados.email,
                    NOT: { id }
                }
            });

            if (emailExistente) {
                return res.status(409).json({
                    mensagem: "Este e-mail já está cadastrado."
                });
            }
        }

        if (Object.keys(dados).length === 0) {
            return res.status(400).json({
                mensagem: "Informe ao menos um campo para atualizar."
            });
        }

        const item = await prisma.usuario.update({
            where: { id },
            data: dados,
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        return res.status(200).json({
            mensagem: "Usuário atualizado com sucesso!",
            atualizado: item
        });
    } catch (erro) {
        if (erro.code === "P2025") {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        console.error("Erro ao atualizar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao atualizar usuário."
        });
    }
};

const excluir = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        const item = await prisma.usuario.delete({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        return res.status(200).json({
            mensagem: "Usuário excluído com sucesso!",
            excluido: item
        });
    } catch (erro) {
        if (erro.code === "P2025") {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        if (erro.code === "P2003") {
            return res.status(409).json({
                mensagem: "Não é possível excluir este usuário porque existem movimentações vinculadas a ele."
            });
        }

        console.error("Erro ao excluir usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao excluir usuário."
        });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
};