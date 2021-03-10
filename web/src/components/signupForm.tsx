import { useMutation } from "@apollo/client";
import React from "react";
import { useHistory } from "react-router-dom";
import { SIGNUP_USER } from "../graphql/mutation";
import TwitterLogo from "../styles/logo/twitter-logo.png";

function SignUpForm(){
const [detail, setDetails] = React.useState({
    name: '',
    email: '',
    password: ''
});

const history = useHistory();

const [signUpNewUser] = useMutation(SIGNUP_USER)

const onFieldChangeHandler = (e : React.ChangeEvent<HTMLInputElement>) =>{
    setDetails((prevState :  any)=>{
        return{
            ...prevState,
            [e.target.name] : e.target.value
        }
    })
}

 const submitSignupUser = async (e:React.FocusEvent<HTMLFormElement>)=>{
     e.preventDefault();
   const res = await  signUpNewUser({
         variables:detail
     });

     localStorage.setItem('token',res.data.signup.token);
     history.push("/"); 
 }

    return(
        <div className="container"> 
        <img src={TwitterLogo} alt="logo" style={{ width: "50px" }} className="logo" />
            <form onSubmit={submitSignupUser}>
                <div>
                    <label>Username</label>
                    <input type="text"  value={detail.name} name="name" onChange={onFieldChangeHandler} />
                </div>

                <div>
                    <label>Email</label>
                    <input type="text" value={detail.email} name="email" onChange={onFieldChangeHandler} />
                </div>

                <div>
                    <label>Password</label>
                    <input type="password" value={detail.password} name="password" onChange={onFieldChangeHandler} />
                </div>
                <button>SignUp</button>
            </form>
        </div>
    );
}
export default SignUpForm;