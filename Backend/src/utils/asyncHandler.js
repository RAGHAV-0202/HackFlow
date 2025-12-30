const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        const errors = error.errors || null;  // standardize errors key
        res.status(statusCode).json({
            statusCode,            
            success: false,        
            message,               
            data: null,           
            errors,                
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};


export default asyncHandler;