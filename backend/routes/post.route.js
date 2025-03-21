import express from "express";
import multer from "multer"; // Import multer for handling file uploads
import { protectRoute } from "../middleware/protectRoute.js";
import { searchPostsAndUsers } from '../controllers/post.controller.js';
import {
	commentOnPost,
	createPost,
	deletePost,
	getAllPosts,
	getFollowingPosts,
	getLikedPosts,
	getUserPosts,
	likeUnlikePost,
	updatePost,
} from "../controllers/post.controller.js";

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Set the destination for uploaded files

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/create", protectRoute, upload.single('img'), createPost); // Handle image upload when creating a post
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/:id", protectRoute, upload.single('img'), updatePost); // Handle image upload when updating a post
router.get('/search', protectRoute, searchPostsAndUsers); // New route for searching users and posts

export default router;
