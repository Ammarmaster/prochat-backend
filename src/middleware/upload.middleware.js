async function uploadMiddleware(req, res, next) {
    
    if(!req.file){
        return res.status(400).json({message:"No file Found "});
    }else{
        return res.status(200).json({message:"File uploaded successfully",file:req.file});
        
    }
}