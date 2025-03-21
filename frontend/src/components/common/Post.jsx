import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
    const [comment, setComment] = useState("");
    const [editedText, setEditedText] = useState(post.text); // State for edited post text
    const [img, setImg] = useState(null); // State for uploaded image
    const [imagePreview, setImagePreview] = useState(post.img); // State for image preview
    const [isEditing, setIsEditing] = useState(false); // State to control the edit modal visibility
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();
    const postOwner = post.user;
    const isLiked = post.likes.includes(authUser._id);
    const isMyPost = authUser._id === post.user._id;
    const formattedDate = formatPostDate(post.createdAt);

    // Mutation for deleting the post
    const { mutate: deletePost, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/${post._id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: () => {
            toast.success("Post deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    // Mutation for liking the post
    const { mutate: likePost, isPending: isLiking } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/like/${post._id}`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: (updatedLikes) => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.map((p) => (p._id === post._id ? { ...p, likes: updatedLikes } : p));
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // Mutation for commenting on the post
    const { mutate: commentPost, isPending: isCommenting } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/comment/${post._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: comment }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: () => {
            toast.success("Comment posted successfully");
            setComment("");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // Mutation for editing the post
    const { mutate: editPost, isPending: isEditingPost } = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("text", editedText);
            if (img) {
                formData.append("img", img); // Append the new image if provided
            }
            const res = await fetch(`/api/posts/${post._id}`, {
                method: "PUT",
                body: formData, // Send the form data
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: () => {
            toast.success("Post updated successfully");
            setIsEditing(false); // Close the modal
            setImg(null); // Reset image state
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const handleDeletePost = () => {
        deletePost();
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (isCommenting) return;
        commentPost();
    };

    const handleLikePost = () => {
        if (isLiking) return;
        likePost();
    };

    const handleEditPost = (e) => {
        e.preventDefault();
        if (isEditingPost) return; // Prevent double submission
        editPost();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImg(file);
        setImagePreview(URL.createObjectURL(file)); // Preview the selected image
    };

    return (
        <>
            <div className='flex gap-2 items-start p-4 border-b border-gray-700'>
                <div className='avatar'>
                    <Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
                        <img src={postOwner.profileImg || "/avatar-placeholder.png"} alt="Profile" />
                    </Link>
                </div>
                <div className='flex flex-col flex-1'>
                    <div className='flex gap-2 items-center'>
                        <Link to={`/profile/${postOwner.username}`} className='font-bold'>
                            {postOwner.fullName}
                        </Link>
                        <span className='text-gray-700 flex gap-1 text-sm'>
                            <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
                            <span>·</span>
                            <span>{formattedDate}</span>
                        </span>
                        {isMyPost && (
                            <span className='flex justify-end flex-1 gap-3'>
                                {!isDeleting && (
                                    <>
                                        <FaEdit className='cursor-pointer hover:text-blue-500' onClick={() => setIsEditing(true)} />
                                        <FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
                                    </>
                                )}
                                {isDeleting && <LoadingSpinner size='sm' />}
                            </span>
                        )}
                    </div>
                    <div className='flex flex-col gap-3 overflow-hidden'>
                        <span>{post.text}</span>
                        {post.img && (
                            <img
                                src={post.img}
                                className='h-80 object-contain rounded-lg border border-gray-700'
                                alt='Post'
                            />
                        )}
                    </div>
                    <div className='flex justify-between mt-3'>
                        <div className='flex gap-4 items-center w-2/3 justify-between'>
                            <div
                                className='flex gap-1 items-center cursor-pointer group'
                                onClick={() => document.getElementById(`comments_modal${post._id}`).showModal()}
                            >
                                <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                                    {post.comments.length}
                                </span>
                            </div>
                            {/* Comments Modal */}
                            <dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
                                <div className='modal-box rounded border border-gray-600'>
                                    <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                                    <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                                        {post.comments.length === 0 && (
                                            <p className='text-sm text-slate-500'>
                                                No comments yet 🤔 Be the first one 😉
                                            </p>
                                        )}
                                        {post.comments.map((comment) => (
                                            <div key={comment._id} className='flex gap-2 items-start'>
                                                <div className='avatar'>
                                                    <div className='w-8 rounded-full'>
                                                        <img src={comment.user.profileImg || "/avatar-placeholder.png"} alt="Commenter" />
                                                    </div>
                                                </div>
                                                <div className='flex flex-col'>
                                                    <div className='flex items-center gap-1'>
                                                        <span className='font-bold'>{comment.user.fullName}</span>
                                                        <span className='text-gray-700 text-sm'>
                                                            @{comment.user.username}
                                                        </span>
                                                    </div>
                                                    <div className='text-sm'>{comment.text}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2' onSubmit={handlePostComment}>
                                        <textarea
                                            className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800'
                                            placeholder='Add a comment...'
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                        <button
                                            type='submit'
                                            disabled={!comment.trim()}
                                            className={`btn btn-sm normal-case ${isCommenting ? "loading" : ""}`}
                                        >
                                            {isCommenting ? "Commenting..." : "Post"}
                                        </button>
                                    </form>
                                    <div className='modal-action'>
                                        <button className='btn btn-sm bg-gray-700 border-gray-600' onClick={() => document.getElementById(`comments_modal${post._id}`).close()}>Close</button>
                                    </div>
                                </div>
                            </dialog>
                            {/* Like button */}
                            <div className='flex gap-1 items-center cursor-pointer group' onClick={handleLikePost}>
                                <FaRegHeart
                                    className={`w-4 h-4 text-slate-500 group-hover:text-red-500 ${isLiked ? "text-red-500" : ""}`}
                                />
                                {isLiking ? (
                                    <LoadingSpinner size='sm' />
                                ) : (
                                    <span className={`text-sm text-slate-500 group-hover:text-red-500 ${isLiked ? "text-red-500" : ""}`}>
                                        {post.likes.length}
                                    </span>
                                )}
                            </div>
                            <div className='flex gap-1 items-center cursor-pointer group'>
                                <BiRepost className='w-5 h-5 text-slate-500 group-hover:text-green-500' />
                                <span className='text-sm text-slate-500 group-hover:text-green-500'>
                                    {post.reposts}
                                </span>
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <FaRegBookmark className='w-4 h-4 text-slate-500 hover:text-amber-400' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Post Modal */}
            {isEditing && (
                <dialog id={`edit_modal${post._id}`} open className='modal border-none outline-none'>
                    <form className='modal-box max-w-md rounded-lg border border-gray-700' onSubmit={handleEditPost}>
                        <div className='flex justify-between mb-4'>
                            <h3 className='font-bold text-lg'>Edit Post</h3>
                            <button type='button' className='btn btn-sm bg-gray-700 border-gray-600' onClick={() => setIsEditing(false)}>
                                Close
                            </button>
                        </div>
                        <textarea
                            className='textarea w-full h-28 resize-none border border-gray-600 rounded-lg text-md'
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                        />
                        <input
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                            className='mt-2 border border-gray-600 rounded-lg'
                        />
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className='mt-2 h-40 object-contain rounded-lg border border-gray-700' />
                        )}
                        <div className='modal-action'>
                            <button type='submit' className={`btn btn-sm normal-case ${isEditingPost ? "loading" : ""}`}>
                                {isEditingPost ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </dialog>
            )}
        </>
    );
};

export default Post;
