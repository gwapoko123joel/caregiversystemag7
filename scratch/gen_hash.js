import bcrypt from 'bcryptjs'

const password = '772004gajilomo'
const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(password, salt)

console.log(hash)
