import jwt from 'jsonwebtoken';
import {
    AuthenticationError,
    UserInputError
} from 'apollo-server';
import {
    combineResolvers
} from 'graphql-resolvers';
import {
    isAdmin
} from './authorization';

const createToken = async (user, secret, expiresIn) => {
    const {
        id,
        email,
        username,
        role
    } = user;
    return await jwt.sign({
        id,
        email,
        username,
        role
    }, secret, {
        expiresIn
    });
};

export default {
    Query: {
        users: async (parent, args, {
            models
        }) => await models.User.findAll(),
        user: async (parent, {
            id
        }, {
            models
        }) => await models.User.findByPk(id),
        me: async (parent, args, {
            models,
            me
        }) => {
            if (!me) {
                return null;
            }
            return await models.User.findByPk(me.id)
        }
    },
    Mutation: {
        signUp: async (parent, {
            username,
            email,
            password,
            role
        }, {
            models,
            secret
        }) => {
            const user = await models.User.create({
                username,
                email,
                password,
                role
            });
            return {
                token: createToken(user, secret, '30m')
            };
        },
        signIn: async (parent, {
            login,
            password
        }, {
            models,
            secret
        }) => {
            const user = await models.User.findByLogin(login);

            if (!user) {
                throw new UserInputError(
                    'No user found with this login credential'
                );
            }

            const isValid = await user.validatePassword(password);

            if (!isValid) {
                throw new AuthenticationError(
                    'Invalid password'
                );
            }
            return {
                token: createToken(user, secret, '30m')
            };
        },
        deleteUser: combineResolvers(
            isAdmin,
            async (parent, {
                id
            }, {
                models
            }) => await models.User.destroy({
                where: {
                    id
                }
            })
        )
    },
    User: {
        messages: async (user, args, {
            models
        }) => await models.Message.findAll({
            where: {
                userId: user.id,
            },
        }),
    },
};