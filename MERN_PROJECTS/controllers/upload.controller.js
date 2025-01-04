const UserModel = require('../models/user.model');
const fs = require('fs');
const { promisify } = require("util");
const pipeline = promisify(require('stream').pipeline);
const { uploadErrors } = require('../utils/erros.utils');

module.exports.uploadProfil = async (req, res) => {
    try {
        if (
            req.file.detectedMimeType !== "image/jpg" &&
            req.file.detectedMimeType !== "image/png" &&
            req.file.detectedMimeType !== "image/jpeg"
        )
            throw new Error("invalid file");

        if (req.file.size > 500000)
            throw new Error("max size");

        const fileName = req.body.name + ".jpg";

        await pipeline(
            req.file.stream,
            fs.createWriteStream(
                `${__dirname}/../client/public/uploads/profil/${fileName}`
            )
        );
    } catch (err) {
        const errors = uploadErrors(err);
        return res.status(201).json({ errors });
    };

    try {
        const userpicture = await UserModel.findByIdAndUpdate(
            req.params.userId,
            {$set : {picture: "./uploads/profil/" + fileName}},
            { new: true, upsert: true, setDefaultsOnInsert: true}
        );
        if (!userpicture) {
            res.status(404).send('User not add following');
        }
        res.status(200).json(userpicture);
    } catch (err) {
        return res.status(500).send({ message: err });
    }

};