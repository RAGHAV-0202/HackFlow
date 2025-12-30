import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import dotenv from "dotenv"
import User from "../models/User.models.js"
import jwt from "jsonwebtoken"
import { sendMail } from "../utils/sendMail.js";

async function generateAccessToken(userId){
    try{
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken() ;

        return accessToken 
        
    }catch(Error){
        throw new apiError(500 , "Something went wrong while generating token")
    }
}

const UserLogin = asyncHandler(async(req,res)=>{
    let {email , password} = req.body ;
    email = email?.trim();
    password = password?.trim() ;

    if(!email || !password){
        throw new apiError(400 , "Both Fields are required");
    }
    const emaillower = email.toLowerCase();
    const user = await User.findOne({email : emaillower})

    if(!user){
        console.log("no user")
        throw new apiError(400 , "Invalid Login or password");
    }

    if(!await user.isPasswordCorrect(password)) {
        throw new apiError(400 , "Invalid Login or password");
    }


    const accessToken = await generateAccessToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
    };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, {
            message: "User logged in successfully",
            accessToken,
            role : user.role,
            userId: user._id
        }));
});

const UserRegister = asyncHandler(async (req, res) => {
    let { name, email, password , role} = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    role = role?.trim() || "participant";
    password = password?.trim();

    if (!name || !email ||  !password) {
        throw new apiError(400, "All Fields are required");
    }

    const ExistingUser = await User.findOne({email});


    if (ExistingUser) {
        throw new apiError(400, "User Already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    console.log(user)

    const accessToken = await generateAccessToken(user._id);


    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, {
            message: "User registered successfully",
            accessToken,
            userId: user._id
        }));
});


const isLoggedIn = asyncHandler(async (req, res) => {
    let AT = req.cookies.accessToken;  
    // let AT ;  

    if (!AT && req.headers.authorization?.startsWith("Bearer ")) {
        AT = req.headers.authorization.split(" ")[1];
    }

    console.log(AT)


    if (!AT) {
        throw new apiError(400, "No token present");
    }

    let decoded;
    try {
        decoded = jwt.verify(AT, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        console.log("Token verification failed", err);
        throw new apiError(401, "Invalid or expired token");
    }

    res.status(200).json(new ApiResponse(200, decoded, "User is logged in"));
});


const UserLogout = asyncHandler(async (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: true, // ensure it's set to true if you're using HTTPS in production
        sameSite: 'None', // should match how it was set
        path: '/' // ensure the path matches how the cookie was set
    };

    // Clear both accessToken and refreshToken cookies
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    // Return the response after clearing the cookies
    return res.status(200).json(new ApiResponse(200, "user logged out"));
});

const UserRefreshAccessToken = asyncHandler(async(req,res)=>{
    const oldRefreshToken = req.cookies.refreshToken

    if(!oldRefreshToken){
        throw new apiError(401 , "Unauthorized access , RAT")
    }

    const decoded = jwt.verify(oldRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decoded._id).select("-password")

    if(!user){
        throw new apiError(401 , "Unauthorized access , RAT")
    }
    
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    // console.log(accessToken) 

        
    const options = {
        httpOnly : true ,
        secure : true
    }

    res.status(200)
        .cookie("accessToken" , accessToken , options )
        .cookie("refreshToken" , refreshToken , options)
        .json(new ApiResponse(200 , {accessToken} , "refreshed token"))

})

const UserPasswordResetRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new apiError(400, "Enter Email");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new apiError(400, "User not registered");
    }

    const token = jwt.sign(
        { _id: user._id },
        process.env.RESET_PASSWORD_SECRET,
        { expiresIn: process.env.RESET_PASSWORD_EXPIRY }
    );

    user.resetToken = token;
    await user.save();

    const link = `${process.env.BASE_URL}/${token}`;
    console.log("Reset Link:", link);

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #007bff;">Password Reset Request</h1>
                <p style="font-size: 16px; color: #333;">We received a request to reset your password. Click the button below to reset your password.</p>
                <a href="${link}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; margin-top: 20px;">Reset Password</a>
                <p style="font-size: 14px; color: #555; margin-top: 20px;">If you did not request this password reset, please ignore this email.</p>
                <p style="font-size: 12px; color: #aaa; margin-top: 20px;">Don't share this link with anyone else. This link will expire in 15 minutes.</p>
            </div>
        </div>
    `;

    // Now this will work because sendMail is defined
    await sendMail(email, "Reset Your Password", htmlContent);

    res.status(200).json(new ApiResponse(200, null, "Reset link sent successfully"));
});

const UserPasswordResetPage = asyncHandler(async(req,res)=>{
    const {token} = req.params
    if(!token){
        throw new apiError(400 , "no token present , Unauthorized Access")
    }

    const {password} = req.body
    if(!password){
        throw new apiError(400 , "Enter Password")
    }

    const decoded = jwt.verify(token , process.env.RESET_PASSWORD_SECRET)
    if(!decoded){
        throw new apiError(400 , "Token Expired or Invalid Token")
    }    

    const user = await User.findById(decoded?._id).select("-password -refreshToken")

    if(!user){
        throw new apiError(400 , "Invalid Token or Token Expired")
    }

    if(user.resetToken !== token){
        throw new apiError(400 , "Reset Link has been used !!!")
    }
    
    user.password = password
    user.resetToken = ""
    await user.save()

    res.status(200).json(new ApiResponse(200, "Password updated successfully"));

})




export {UserLogin , UserRegister,UserLogout,UserRefreshAccessToken , UserPasswordResetRequest,UserPasswordResetPage , isLoggedIn}