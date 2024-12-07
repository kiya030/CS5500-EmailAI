// src/api.js
export const fetchProtectedData = () => {
    const token = localStorage.getItem('accessToken');

    fetch('http://127.0.0.1:8000/protected-route', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to fetch protected data");
            }
            return res.json();
        })
        .then((data) => {
            console.log("Protected data:", data);
        })
        .catch((error) => {
            console.error("Error fetching protected data:", error);
        });
};  