// src/hooks/useShowToast.js
import { toast } from "react-toastify"; // Assuming you're using a library like 'react-toastify' for toasts

const useShowToast = () => {
  const showToast = (message, type = "info") => {
    toast(message, { type });
  };

  return showToast;
};

export default useShowToast;
