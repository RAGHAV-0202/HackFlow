import apiError from "../utils/apiError.js"
import asyncHandler from "../utils/asyncHandler.js";

export const isAdmin = asyncHandler(async(req, res, next) => {
    if (req.user.role !== "admin") {
        throw new apiError(403, "Admin access required");
    }
    next();
});

export const isOrganizer = asyncHandler(async(req, res, next) => {
    if (req.user.role !== "organizer" && req.user.role !== "admin") {
        throw new apiError(403, "Organizer access required");
    }
    next();
});

export const isJudge = asyncHandler(async(req, res, next) => {
    if (req.user.role !== "judge" && req.user.role !== "admin") {
        throw new apiError(403, "Judge access required");
    }
    next();
});

export const HighLevelAuthority = asyncHandler(async (req, res, next) => {
    if (req.user.role !== "organizer" && req.user.role !== "admin") {
        throw new apiError(403, "Organizer or Admin access required");
    }
    next();
});

export const allowRoles = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new apiError(403, "Access denied");
        }
        next();
    });
};