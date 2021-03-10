import { useMutation } from "@apollo/client";
import React from "react";
import { useHistory } from "react-router-dom";
import { LOGIN_USER } from "../graphql/mutation";
import TwitterLogo from "../styles/logo/twitter-logo.png";

function LoginForm(){

    const [detail, setDetails] = React.useState({
        email: '',
        password: ''
    });
    const history = useHistory();
    const [loginUser] = useMutation(LOGIN_USER);
    
    const onFieldChangeHandler = async (e : React.ChangeEvent<HTMLInputElement>) =>{
     setDetails((prevState :  any)=>{
            return{
                ...prevState,
                [e.target.name] : e.target.value
            }
        });

    }

 const submitLogin = async (e:React.FocusEvent<HTMLFormElement>)=>{
     console.log(detail)
    e.preventDefault();
  const res = await  loginUser({
        variables:detail
    });
    localStorage.setItem('token',res.data.login.token);
    history.push("/"); 
}

    return(
        <div className="container">
            <img src={TwitterLogo} alt="logo" style={{ width: "50px" }} className="logo" />
            <form onSubmit={submitLogin}>
            <div>
                    <label>Email</label>
                    <input type="text" value={detail.email} name="email" onChange={onFieldChangeHandler} />
                </div>

                <div>
                    <label>Password</label>
                    <input type="password" value={detail.password} name="password" onChange={onFieldChangeHandler} />
                </div>
                <button>Login</button>
            </form>
        </div>
    );
}
export default LoginForm;