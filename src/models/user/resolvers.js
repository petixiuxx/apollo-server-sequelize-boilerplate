import jwt from 'jsonwebtoken';
import {
    AuthenticationError,
    UserInputError
} from 'apollo-server';
import 'dotenv/config';

import {
    combineResolvers
} from 'graphql-resolvers';
import {
    createToken,
    isAdmin
} from '../../utils';
export const Query = {
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
};
export const Mutation = {
    signUp: async (parent, {
        username,
        email,
        password,
        role
    }, {
        models,
        secret
    }) => {
        const user = await models.User.findByLogin(email);
        if (user) {
            throw new Error("User with this email already existed");
        }

        const newUser = await models.User.create({
            username,
            email,
            password,
            role
        });
        createToken(newUser, secret, '30m')
            .then(token => {
                newUser.token = token
                newUser.save((err) => {
                    if (err) {
                        console.log("Error: " + err.message);
                    }
                })
            })

        return newUser;
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
        const verifiedUser = jwt.verify(user.token, process.env.SECRET);
        if (!verifiedUser) {
            createToken(user, secret, '30m')
                .then(token => {
                    user.token = token
                    user.save((err) => {
                        if (err) {
                            throw new Error("Error: " + err.message);
                        }
                    })
                })
        }

        return user;
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
};
export const User = {
    messages: async (user, args, {
        models
    }) => await models.Message.findAll({
        where: {
            userId: user.id,
        },
    }),
}