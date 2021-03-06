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
    const client= new ApolloClient({
        link: link,
        cache: new InMemoryCache()
    })

    return (
        <ApolloProvider client={client}>
            <App/>
        </ApolloProvider>
    )

}
export default AppProviderApollo;