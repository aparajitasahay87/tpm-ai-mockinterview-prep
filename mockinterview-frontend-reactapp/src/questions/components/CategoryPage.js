/*import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CategoryList from '../questions/components/CategoryList';
import Login from '../auth/components/LoginPage';

function CategoryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (user) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(setCategories)
        .catch(console.error);
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  return (
    <div>
      <h2>Select a Category</h2>
      <CategoryList categories={categories} />
    </div>
  );
}

export default CategoryPage;
*/
