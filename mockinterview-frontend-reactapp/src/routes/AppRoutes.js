// src/routes/AppRoutes.js
import Home from '../pages/Home';
import LoginPage from '../auth/components/LoginPage';
import FeedbackForm from '../feedback/components/FeedbackForm';
import LogoutPage from '../auth/components/LogoutPage';
//import CategoryPage from '../questions/components/CategoryList';
import CategoryList from '../questions/components/CategoryList';
import QuestionsPage from '../questions/components/QuestionsPage';
import QuestionDetailPage from '../questions/components/QuestionDetailPage';



const routes = [
  {
    path: '/',
    Component: Home,
    isProtected: true,
  },
  {
    path: '/login',
    Component: LoginPage,
    isProtected: false,
    redirectTo: '/',
  },
  {
    path: '/feedback',
    Component: FeedbackForm,
    isProtected: true,
  },
  {
  path: '/logout',
  Component: LogoutPage,
  isProtected: true,
},
{
    path: '/categories',
    Component: CategoryList,
    isProtected: true,
  },
  {
    path: '/questions', // Add this route
    Component: QuestionsPage,
    isProtected: true,
  },
  {
    path: '/question/:questionId' ,
    Component: QuestionDetailPage,
    isProtected: true,
  }
];

export default routes;
