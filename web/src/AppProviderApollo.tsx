import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import React from "react";
import App from "./App";

function AppProviderApollo() {

    const httpLink = new HttpLink({
        uri: "http://localhost:4000"
    });

    const authLink = setContext(async (req, { headers }) => {
        const token = localStorage.getItem("token")
        return {
            ...headers,
            headers: {
                Authorization: token ? `Bearer ${token}` : null
            }
        }
    });

    const link = authLink.concat(httpLink);
    const clientApp= new ApolloClient({
        link: link,
        cache: new InMemoryCache()
    })

    return (
        <ApolloProvider client={clientApp}>
            <App/>
        </ApolloProvider>
    )

}
export default AppProviderApollo;