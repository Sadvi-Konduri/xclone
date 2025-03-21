import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";


export const createPost = async (req, res) => {
	try {
		const { text } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}

		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		const newPost = new Post({
			user: userId,
			text,
			img,
		});

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

// Search posts by text or user
/*export const searchPostsAndUsers = async (req, res) => {
	try {
		const { query } = req.query;

		// Search for posts where the text matches the query or the user's username matches the query
		const posts = await Post.find({
			$or: [
				{ text: { $regex: query, $options: "i" } }, // Case-insensitive search in post text
				{ "user.username": { $regex: query, $options: "i" } }, // Search by username (join with user)
			],
		})
			.populate({
				path: "user",
				select: "username -_id", // Populate user details without password
			})
			.sort({ createdAt: -1 });

		const users = await User.find({
			username: { $regex: query, $options: "i" }, // Search users by username
		}).select("username profileImg -_id");

		res.status(200).json({ posts, users });
	} catch (error) {
		console.log("Error in searchPostsAndUsers controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};*/

// Other existing controller methods...

export const searchPostsAndUsers = async (req, res) => {
	try {
		const { query } = req.query;

		const posts = await Post.find({
			$or: [
				{ text: { $regex: query, $options: "i" } }, // Case-insensitive search in post text
				{ "user.username": { $regex: query, $options: "i" } }, // Search by username (join with user)
			],
		})
			.populate({
				path: "user",
				select: "username profileImg -_id", // Populate user details without password
			})
			.sort({ createdAt: -1 });

		const users = await User.find({
			username: { $regex: query, $options: "i" }, // Search users by username
		}).select("username profileImg -_id");

		if (posts.length === 0 && users.length === 0) {
			return res.status(404).json({ message: "No users or posts found." });
		}

		res.status(200).json({ posts, users });
	} catch (error) {
		console.log("Error in searchPostsAndUsers controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};


export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = { user: userId, text };

		post.comments.push(comment);
		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const likeUnlikePost = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id: postId } = req.params;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		} else {
			// Like post
			post.likes.push(userId);
			await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
			await post.save();

			const notification = new Notification({
				from: userId,
				to: post.user,
				type: "like",
			});
			await notification.save();

			const updatedLikes = post.likes;
			res.status(200).json(updatedLikes);
		}
	} catch (error) {
		console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};



// Update post
export const updatePost = async (req, res) => {
    try {
        const { text } = req.body; // Get updated text from the request body
        const postId = req.params.id;
        const userId = req.user._id.toString();

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.user.toString() !== userId) {
            return res.status(401).json({ error: "You are not authorized to update this post" });
        }

        // If an image is provided, handle the upload
        if (req.file) {
            // If there's an existing image, delete it from Cloudinary
            if (post.img) {
                const imgId = post.img.split("/").pop().split(".")[0]; // Extract the public ID from the URL
                await cloudinary.uploader.destroy(imgId); // Delete the existing image
            }
            const uploadedResponse = await cloudinary.uploader.upload(req.file.path);
            post.img = uploadedResponse.secure_url; // Update the image URL
        }

        post.text = text; // Update the text of the post

        await post.save(); // Save the updated post
        res.status(200).json(post); // Return the updated post
    } catch (error) {
        console.log("Error in updatePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add other controller functions here (like deletePost, commentOnPost, etc.)



export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
