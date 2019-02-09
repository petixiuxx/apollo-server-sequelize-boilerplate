import {
    combineResolvers
} from 'graphql-resolvers';
import isAuthenticated, {
    isMessageOwner
} from './authorization';
import Sequelize from 'sequelize';


export default {
    Query: {
        messages: async (parent, {
            cursor,
            limit = 100
        }, {
            models
        }) => {
            const cursorOptions = cursor ?
                {
                    where: {
                        createdAt: {
                            [Sequelize.Op.lt]: cursor,
                        },
                    },
                } :
                {};
            return await models.Message.findAll({
                limit,
                ...cursorOptions
            })
        },
        message: async (parent, {
            id
        }, {
            models
        }) => await models.Message.findByPk(id)
    },
    Mutation: {
        createMessage: combineResolvers(
            isAuthenticated,
            async (parent, {
                text
            }, {
                me,
                models
            }) => await models.Message.create({
                text,
                userId: me.id
            })
        ),
        deleteMessage: combineResolvers(
            isAuthenticated,
            isMessageOwner,
            async (parent, {
                id
            }, {
                models
            }) => await models.Message.destroy({
                where: {
                    id
                }
            })
        ),
    },
    Message: {
        user: async (message, args, {
            models
        }) => await models.User.findByPk(message.userId)
    },
};