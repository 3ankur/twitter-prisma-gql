import { gql } from "@apollo/client";

export const IS_LOGIN = gql`
     {
        me{
        id
    }
     }
`;