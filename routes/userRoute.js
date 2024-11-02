import { Router } from  'express'
import { forgetPassword, googleAuth, resetPassword, signIn, signUp, userDetails, userProfile } from '../controllers/userCtrl.js';


const userRouter =Router()
// SIGNUP
userRouter.post("/signup", signUp);
userRouter.post("/google/auth", googleAuth);
userRouter.post("/api/profile", userProfile);
//SIGNIN
userRouter.post("/signin", signIn);
userRouter.post("/dashboard", userDetails);
//FOROGT PASSWORD
userRouter.post("/forgot", forgetPassword);
//FOROGT PASSWORD
userRouter.post("/reset-password", resetPassword);


export default userRouter

