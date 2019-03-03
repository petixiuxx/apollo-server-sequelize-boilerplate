import jwt from 'jsonwebtoken';

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

export default createToken;