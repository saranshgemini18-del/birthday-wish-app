const API_URL = 'http://localhost:3001/api';

export const api = {
    async getWishes() {
        try {
            const response = await fetch(`${API_URL}/wishes`);
            if (!response.ok) throw new Error('Failed to fetch wishes');
            return await response.json();
        } catch (err) {
            console.error(err);
            return [];
        }
    },

    async addWish(content) {
        try {
            const response = await fetch(`${API_URL}/wishes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error('Failed to add wish');
            return await response.json();
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async deleteWish(id) {
        try {
            const response = await fetch(`${API_URL}/wishes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete wish');
            return await response.json();
        } catch (err) {
            console.error(err);
            return false;
        }
    }
};
