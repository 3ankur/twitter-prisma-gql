import { gql } from "@apollo/client";

export const SIGNUP_USER = gql`
    mutation SignUp($name: String!, $email: String!, $password: String!){
        signup(name: $name, email: $email, password : $password){
            token
        }   
    }
`;

export const LOGIN_USER = gql`
    mutation Login($email: String!, $password: String!){
        login(email: $email, password:$password){
            token
        }
    }
`;