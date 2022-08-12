import User from "./user"
//const fetchUser = async(userId:Number):Promise<User> => Promise.resolve({id: userId, name: 'tam'})
const fetchUser = async(userId:Number):Promise<User> => Promise.reject('cannot fetch user by id')

export {
    fetchUser
}