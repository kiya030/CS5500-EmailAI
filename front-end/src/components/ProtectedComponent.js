import React, { useEffect, useState } from 'react';

const ProtectedComponent = () => {
    console.log('ProtectedComponent rendered'); // Debug log to confirm rendering

    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setError('No access token found. Please log in.');
            return;
        }

        console.log('Fetching protected data...');

        fetch('http://127.0.0.1:8000/protected-route', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch protected data');
                }
                return res.json();
            })
            .then((data) => {
                console.log('Protected data:', data);
            })
            .catch((err) => {
                setError(err.message);
                console.error('Error fetching protected data:', err);
            });
    }, []);

    return (
        <div>
            {error ? (
                <div>Error: {error}</div>
            ) : (
                'Check the console for protected data.'
            )}
        </div>
    );
};

export default ProtectedComponent;