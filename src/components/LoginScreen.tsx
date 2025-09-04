import React from 'react';

const GoogleIcon: React.FC = () => (
  <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.151,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="bg-gray-900 text-gray-300 font-sans flex flex-col items-center justify-center h-screen p-4">
      <div className="text-center max-w-sm w-full">
        <img 
            src="https://res.cloudinary.com/djojon779/image/upload/v1754260994/ChatGPT_Image_3_ago_2025_04_34_50_p.m._naw5on.png" 
            alt="QuantumTrade Logo"
            className="h-auto w-3/4 max-w-[240px] mx-auto mb-6"
        />
        <p className="text-lg text-gray-400 mb-10">Welcome to the future of trading.</p>

        <button
          onClick={onLogin}
          className="w-full sm:w-auto bg-white text-gray-700 font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-all duration-300 flex items-center justify-center mx-auto"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className="mt-12 text-sm text-gray-500">
          Impulsado por IA para traders inteligentes.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;