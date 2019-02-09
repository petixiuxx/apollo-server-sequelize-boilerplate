import jwt from 'jsonwebtoken';
import express from 'express';
import {
  ApolloServer,
  AuthenticationError
} from 'apollo-server-express';
import cors from 'cors';
import 'dotenv/config';

import schema from './schema';
import resolvers from './resolvers';
import models, {
  sequelize
} from './models';

const getMe = async req => {
  const token = req.headers['x-token'];

  if (token) {
    try {
      return await jwt.verify(token , process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError('Your session expired. Sign in again');
    }
  }
}

const createUsersWithMessage = async date => {
  await models.User.create({
    username: 'kaitou',
    email: 'petixiuxx@gmail.com',
    password: 'holmes4869',
    role: 'ADMIN',
    messages: [{
      text: 'Published ',
      createdAt: date.setSeconds(date.getSeconds()  + 1),
    }]
  }, {
    include: [models.Message]
  });

  await models.User.create({
    username: 'davis',
    email: 'davis@gmail.com',
    password: 'holmes4869',
    messages: [{
      text: 'Happy to relesa',
      createdAt: date.setSeconds(date.getSeconds() + 1),
    }, {
      text: 'Publised something',
      createdAt: date.setSeconds(date.getSeconds() + 1),
    }]
  }, {
    include: [models.Message]
  })
};
const app = express();
// const PORT = process.env.PORT;
app.use(cors());


const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');
    return {
      ...error,
      message,
    };
  },
  context: async ({ req }) => {
    const me = await getMe(req);
    
    return {
      models,
      me,
      secret: process.env.SECRET
    }
  }
});

server.applyMiddleware({
  app,
  path: '/graphql'
});
const eraseDatabaseOnSync = true;
sequelize.sync({
  force: eraseDatabaseOnSync
}).then(async () => {
  if (eraseDatabaseOnSync) {
    createUsersWithMessage(new Date());
  }

  app.listen({
    port: 8000
  }, () => {
    console.log('Apollo Server on http://localhost:8000/graphql');
  });
});