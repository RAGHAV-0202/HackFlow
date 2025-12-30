import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/User.models.js";
import mongoose from "mongoose"

const me = asyncHandler(async(req,res)=>{
    const user = req.user ;
    if(!user){
        throw new apiError(403 , "No user found , login again")
    }

    const userDetails = await User.findById(user._id)
                                  .select("-password")
                                  .populate("teams hackathonsJoined");

    if(!userDetails) throw new apiError(403 , "Invalid user id")
    
    return res.status(200).json(new ApiResponse(200 , userDetails , "fetched successfully"));
})

const getAllusers = asyncHandler(async(req,res)=>{
    const users = await User.find();
    return res.status(200).json(new ApiResponse(200 , users , "users fetched"))
}) // admin

const getUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    if(!id){
        throw new apiError(400 , "no id present")
    }
    const user = await User.findById(id).select("-password");;
    if(!user){
        throw new apiError(404 , "no user found / invalid id")
    }
    return res.status(200).json(new ApiResponse(200 , user , "user fetched"))
})

const deleteUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    if(!id){
        throw new apiError(400 , "No id present")
    }
    if(!mongoose.Types.ObjectId.isValid(id)) {
        throw new apiError(400, "Invalid id format");
    }
    const user = await User.findByIdAndDelete(id).select("-password");
    if(!user){
        throw new apiError(404 , "No user found / invalid id")
    }
    return res.status(200).json(new ApiResponse(200 , { email: user.email, id: user._id }, "User deleted successfully"))
}) // admin

const updateRole = asyncHandler(async(req,res)=>{
    const {role} = req.body ;
    const { id } = req.params;

    const validRoles = ["participant", "judge", "organizer", "admin"];
    if (!validRoles.includes(role)) {
        throw new apiError(400, "Invalid role provided");
    }
    
    if(!id){
        throw new apiError(400 , "no id present")
    }
    const user = await User.findById(id).select("-password");;
    if(!user){
        throw new apiError(404 , "no user found / invalid id")
    }
    user.role = role ;
    await user.save();

    return res.status(200).json(new ApiResponse(200 , user , "user role updated"))
})

export {me , getAllusers , getUser , deleteUser , updateRole} 