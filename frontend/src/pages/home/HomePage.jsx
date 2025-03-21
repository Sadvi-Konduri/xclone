import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
  const [feedType, setFeedType] = useState("forYou");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [followingUsers, setFollowingUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const fetchFollowingUsers = async () => {
      if (feedType === "following") {
        try {
          const res = await fetch("/api/users/following", { method: "GET", credentials: "include" });
          const data = await res.json();

          if (!res.ok) {
            setFollowingUsers([]);
            return;
          }

          setFollowingUsers(data);
        } catch (error) {
          console.error("Error fetching following users:", error);
        }
      }
    };
    fetchFollowingUsers();
  }, [feedType]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`/api/users/profile/${searchQuery}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.message || "User not found");
        return;
      }

      setSearchError(null);
      navigate(`/profile/${data.username}`);
    } catch (error) {
      console.error("Search Error:", error);
      setSearchError("User not found");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <>
      <div className="flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen">
        {/* Header */}
        <div className="flex w-full border-b border-gray-700 justify-between items-center p-4">
          <div className="flex space-x-4">
            <div
              className={`flex justify-center p-3 transition duration-300 cursor-pointer relative ${
                theme === "light" ? "hover:bg-gray-200" : "hover:bg-secondary"
              }`}
              onClick={() => setFeedType("forYou")}
            >
              For you
              {feedType === "forYou" && <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>}
            </div>
            <div
              className={`flex justify-center p-3 transition duration-300 cursor-pointer relative ${
                theme === "light" ? "hover:bg-gray-200" : "hover:bg-secondary"
              }`}
              onClick={() => setFeedType("following")}
            >
              Following
              {feedType === "following" && <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>}
            </div>
          </div>
          {/* Theme Switch Button */}
          <button className="btn btn-outline" onClick={toggleTheme}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <input
            type="text"
            className="input input-bordered w-full mb-2"
            placeholder="Search for a user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary w-full" onClick={handleSearch}>
            Search
          </button>

          {searchError && <p className="text-red-500 text-center mt-2">{searchError}</p>}
        </div>

        {/* CREATE POST INPUT */}
        <CreatePost />

        {/* FOLLOWING USERS */}
        {feedType === "following" ? (
          followingUsers.length > 0 ? (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Following</h2>
              {followingUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-4 p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <img
                    src={user.profileImg || "/avatar-placeholder.png"} // Updated image path
                    alt={`${user.username}'s profile`}
                    className="w-10 h-10 rounded-full"
                  />
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 p-4">You're not following any users.</p>
          )
        ) : (
          <Posts feedType={feedType} />
        )}
      </div>
    </>
  );
};

export default HomePage;
