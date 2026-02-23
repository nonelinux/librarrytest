// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyAGyw8mIxEGI-iVveToUEzBH8IQLRQK_oQ",

  authDomain: "loginsofflibrarry.firebaseapp.com",

  projectId: "loginsofflibrarry",

  storageBucket: "loginsofflibrarry.firebasestorage.app",

  messagingSenderId: "24575544080",

  appId: "1:24575544080:web:1d338de5b963ce2726f395",

  measurementId: "G-JJFZ9F4EXV"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);