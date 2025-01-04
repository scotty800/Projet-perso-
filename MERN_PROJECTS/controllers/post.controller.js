const postModel = require('../models/post.models');
const UserModel = require('../models/user.model');
const { uploadErrors } = require('../utils/erros.utils');
const ObjectID = require('mongoose').Types.ObjectId;
const fs = require('fs');
const { promisify } = require("util");
const pipeline = promisify(require('stream').pipeline);

module.exports.readPost = async (req, res) => {
    try {
        const posts = await postModel.find();
        res.status(200).json(posts).sort({ createAt: -1 });
    } catch (err) {
        console.log("Error to get data: " + err);
    }
}

module.exports.createPost = async (req, res) => {
    let fileName;

    if (req.fil !== null) {
        try {
            if (
                req.file.detectedMimeType !== "image/jpg" &&
                req.file.detectedMimeType !== "image/png" &&
                req.file.detectedMimeType !== "image/jpeg"
            )
                throw new Error("invalid file");

            if (req.file.size > 500000)
                throw new Error("max size");
        } catch (err) {
            const errors = uploadErrors(err);
            return res.status(201).json({ errors });
        }
        fileName = req.body.posterId + Date.now() + '.jpg';

        await pipeline(
            req.file.stream,
            fs.createWriteStream(
                `${__dirname}/../client/public/uploads/posts/${fileName}`
            )
        );
    }

    const newPost = new postModel({
        posterId: req.body.posterId,
        message: req.body.message,
        picture: req.file !== null ? "./uploads/posts/" + fileName : "",
        video: req.body.video,
        likers: [],
        comments: [],
    });

    try {
        const post = await newPost.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(400).send(err);
    }
}

module.exports.updatePost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);

    try {
        const UpdateRecord = {
            message: req.body.message
        }
        const postupdate = await postModel.findByIdAndUpdate(
            req.params.id,
            { $set: UpdateRecord },
            { new: true },
        )
        res.status(200).json(postupdate);
    } catch (err) {
        console.log("Update error: " + err);
    }

}

module.exports.deletePost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);

    try {
        const deletePost = await postModel.findByIdAndDelete(req.params.id)
        if (!deletePost)
            res.status(404).send({ message: "post not found. " });
        res.status(200).json({ message: "Successfully deleted. " });
    } catch (err) {
        console.log("Delete error : " + err);
    }
}

module.exports.likePost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);

    try {
        const likerPost = await postModel.findByIdAndUpdate(
            req.params.id,
            {
                $addToSet: { likers: req.body.id }
            },
            { new: true },
        );
        if (!likerPost) {
            return res.status(404).send('Post not found');
        }

        const userliker = await UserModel.findByIdAndUpdate(
            req.body.id,
            {
                $addToSet: { likes: req.params.id }
            },
            { new: true },
        );
        if (!userliker) {
            return res.status(404).send('User not found');
        }
        res.status(200).json({ likerPost, userliker });
    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports.unlikePost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);

    try {
        const likerPost = await postModel.findByIdAndUpdate(
            req.params.id,
            {
                $pull: { likers: req.body.id }
            },
            { new: true },
        );
        if (!likerPost) {
            return res.status(404).send('Post not found');
        }

        const userliker = await UserModel.findByIdAndUpdate(
            req.body.id,
            {
                $pull: { likes: req.params.id }
            },
            { new: true },
        );
        if (!userliker) {
            return res.status(404).send('User not found');
        }
        res.status(200).json({ likerPost, userliker });
    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports.commentPost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);
    try {
        commentpost = await postModel.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        commenterid: req.body.commenterid,
                        commenterPseudo: req.body.commenterPseudo,
                        text: req.body.text,
                        Timestamp: new Date().getTime()
                    },
                },
            },
            { new: true },
        );
        if (!commentpost) {
            res.status(404).send('Post not found');
        }
        res.status(200).json({ commentpost });
    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports.editCommentPost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);

    try {
        editcomment = await postModel.findById(
            req.params.id
        );

        if (!editcomment) {
            return res.status(404).send('Post not found');
        }

        const theComment = editcomment.comments.find((comment) =>
            comment._id.equals(req.body.commentid)
        );
        if (!theComment) {
            return res.status(404).send('Comment not found');
        }

        theComment.text = req.body.text;

        await editcomment.save();

        res.status(200).json(editcomment);

    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports.deleteCommentPost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
        return res.status(400).send('ID unKnown' + req.params.id);
    try {
        deletecomment = await postModel.findByIdAndUpdate(
            req.params.id,
            {
                $pull: {
                    comments: {
                        _id: req.body.commentid,
                    },
                },
            },
            { new: true },
        );
        if (!deletecomment) {
            res.status(404).send('Post not found');
        }
        res.status(200).json({ deletecomment });
    } catch (error) {
        return res.status(400).send(err);
    }
}