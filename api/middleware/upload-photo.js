const multer = require('multer')
const maxSize= 1024 * 1024 * 5 //5MB
// const storage = multer.memoryStorage()
// Multer Option 

const fileFilter = (req, file, cb) => {
   
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.mimetype)) {
        
        const error = new Error('wrong file types')
        error.code = 'LIMIT_FILE_TYPES'
        return cb(error, false)
    }
    cb(null, true);
};

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        let generate = file.originalname.replace(/\s/g, '');
        cb(null, uniqueSuffix+'-'+generate)
    },
})

const upload = multer({
    storage: storage,
    limits:{
        fileSize: maxSize,
        files: 6
    },
    fileFilter: fileFilter
});

module.exports = upload;