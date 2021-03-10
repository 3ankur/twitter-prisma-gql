
import { useQuery } from "@apollo/client";
import React from "react";
import { IS_LOGIN } from "../graphql/queries";

type Iprops = {
    children: React.ReactNode
}
function IsAuthenticated({children}: Iprops){

    const {data,loading,error} = useQuery(IS_LOGIN);
    console.log(data,"===>");
    if(loading){
        return <p>Loading...</p>
    }
    if(error){
        return <p>{error.message}</p>
    }
    if(!data?.me){
        return<p>Not autherised</p>
    }

    return(<>{children}</>);

}
export default IsAuthenticated;