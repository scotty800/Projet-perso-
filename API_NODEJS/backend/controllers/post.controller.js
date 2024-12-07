const postModel = require("../models/post.model");

module.exports.getPosts = async (req, res) => {
    const posts = await  postModel.find();
    res.status(200).json(posts);
};

module.exports.setPosts = async (req, res) => {
    if (!req.body.message) {
        res.status(400).json({message: "Merci d'ajouter un message"});
    }

    const post = await postModel.create({
        message: req.body.message,
        author: req.body.author
    });
    res.status(200).json(post);
};

module.exports.editPost = async (req, res) => {
    const post = await postModel.findById(req.params.id)

    if(!post) {
        res.status(400).json({message: "Ce Post n'existe pas"});
    }

    const updatePost = await postModel.findByIdAndUpdate(
        post,
        req.body,
        {new: true}
    )
    res.status(200).json(updatePost);
};

module.exports.deletePost = async (req, res) => {
    const post = await postModel.findById(req.params.id);

    if(!post) {
        res.status(400).json({message: "Ce Post n'existe pas"});
    }

    await postModel.deleteOne();
    res.status(200).json("Message supprimé " + req.params.id);

};

module.exports.likePost = async (req, res) => {
    try {
        await postModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { likers: req.body.userId } }, 
            { new: true }
        ).then((data) => res.status(200).send(data));
    } catch (err) {
        res.status(400).json(err);
    }
}

module.exports.dislikePost = async (req, res) => {
    try {
        await postModel.findByIdAndUpdate(
            req.params.id,
            { $pull: { likers: req.body.userId } }, 
            { new: true }
        ).then((data) => res.status(200).send(data));
    } catch (err) {
        res.status(400).json(err);
    }
}