---
title: What Happens When You Type 'google.com' Into Your Browser
slug: tracing-url-request
summary: We trace a URL request from the browser to the server and its rendering.
description: We trace a URL request from the browser to the server and its rendering. 
date: 2023-04-14
categories: [Technical, Web]
tags: [Networking, DNS Request, Firewall, Load Balancing]
draft: false
---

{{< alert "circle-info" >}}
This article was done in fulfillment of an assignment for a Software Engineering course.
{{< /alert >}}

Billions of people on earth open their browsers everyday and type their favourite website's URL - be it a social media site or some news outlet. Depending on your internet speed, this might be a matter of milliseconds but have you ever wondered what happens behind the scenes? I'll get into that, hint - it's a lot.

## DNS Request

Your browser does not know what 'google.com' is so as soon a you hit enter, it tries to resolve this into an IP address - it does this using a DNS (Domain Name System) lookup. This is where your browser checks different locations for cached DNS data starting from its own cache, operating system, router and finally the DNS server at your Internet Service Provider (ISP). In the event the IP address of the website you want to visit can't be found, your browser does a recursive DNS lookup where it asks multiple DNS servers around the internet which in turn ask other DNS servers until it gets the DNS record. 

At this point the DNS record is cached so that future requests for the same domain can be resolved more quickly.

## Firewall

Once the browser sends a request, before it gets to the server it will pass through a firewall.

A firewall is a network security device that monitors incoming and outgoing network traffic and decides whether to allow or block specific traffic based on a defined set of security rules.

Its main function is to protect the network from threat actors so when you type `google.com`, the request passes through the firewall on its way to Google's servers where depending on the security rules access may be denied. 

## Browser Performs TCP 3-Way Handshake

Packets from the browser are sent to the server the IP address connects to using transmission control protocol (TCP). This is because TCP/IP is reliable and ensures data is sent in the correct order with no packetloss which is crucial when trying to load a website. 

Here's what happens:

1. The browser sends the initial packet with a SYN (SYNchronize) header bit to establish connection. ("Hey, are you available next Tuesday?") 
2. Upon receiving, the web server sends back a SYN-ACK (SYNchronize-ACKnowledge). ("Hey, yes I am free.")
3. The browser send back ACK. ("A-Okay, let's talk.")

That is the 3-way handshake after which a socket is created. This is a two way communication link that facilitates transfer of data.

Most websites have migrated to HTTPS which encrypts the web traffic so if you had typed `http://www.google.com`, the web server will return a 301 error code for Permanent Redirect. The browser will be redirected to `https://www.google.com` but it will first send a FIN packet, the server will respond with ACK and the socket is closed afterwhich the browser will attempt to connect to the redirected link.

The DNS request and the 3-way handshake happen again as well as a SSL/TLS handshake. This is a negotiation between two parties on a network to establish the details of their connection. It determines what version of SSL/TLS will be used in the session, which cipher suite will encrypt communication, verifies the server (and sometimes also the client), and establishes that a secure connection is in place before transferring data.

## Other Concepts To Know
### Load Balancing

A load balancer sits in front of a server and distributes network traffic across all servers capable of fulfilling those request. It does this through various load balancing methods but its ultimate goal is to ensure no single server is overloaded by maximizing speed and capacity.

It is important to know that it is very likely that the first connection to `google.com` was made to a load balancer instead of actual web servers due to the large amount of traffic they receive. 

If a server goes down, traffic is sent ot the remaining servers and if a new server is added, the load balancer starts sending requests to it.

### Web Servers vs. Application Servers

In a typical deployment, a website that provides both static and dynamically generated content runs web servers for the static content and application servers to generate content dynamically. 

A web server is a computer program whose fundamental job is to accept and fulfill requests from clients for static content from a website (HTML pages, files, images, video, and so on).

An application server's fundamental job is to provide its clients with access to what is commonly called business logic, which generates dynamic content; that is, it’s code that transforms data to provide the specialized functionality offered by a business, service, or application. 

All in all, the two concepts differ but they are usually deployed together to fulfill the request of a user for a website's content.

For the case of typing `google.com` into your browser, their web server will receive your request and process it, generate a response (static content) and send it back to the user's browser to render the web page. The web server will also get in touch with the application server to generate search results and in some complex cases, it may need to make a request to a database server.

### Database Server

A database server runs a Database Management System (DBMS) and provides database services to clients. Its main role is to receive requests from client machines, search for the required data, and pass back the results. It consists of physical hardware as well as the software that runs the database. 

It is a crucial component in the client-server computing environment where it provides business-critical information requested by the client systems. This information is sent back to the user and their browser will render it. 

## Browser Renders The Content

Once the browser has received the response from the servers, it inspects the response headers for information on how to render the resource.

In the response, there is a `Content-Type` header that tells the browser which resource it has received in the response body. For the case of a HTML file, the browser will render the structure of the page and if it gets other resources such as CSS, JavaScript or images, it will render them accordingly. 

## Summing Up

This is the simplified final flow:
1. On pressing enter, the browser finds the website's IP address with the help of a DNS server.
2. The browser then makes a connection with the web server (either directly or through a load balancer) using TCP/IP to send a copy of the website.
3. All the while, the back and forth communication passes through firewalls and if everything is approved, the servers (web, application and database server) start sending the website's content in small chunks (data packets).
4. The browser assembles the small chunks and renders the page to the user. 

You have successfully landed on `google.com` or any other website after multiple steps that barely takes more than a second.

## Explore Further 

- [AWS: What happens when you type a URL into your browser?](https://aws.amazon.com/blogs/mobile/what-happens-when-you-type-a-url-into-your-browser/)
- [Cisco: What Is a Firewall?](https://www.cisco.com/c/en/us/products/security/firewalls/what-is-a-firewall.html)
- [SSL.com: The SSL/TLS Handshake: an Overview](https://www.ssl.com/article/ssl-tls-handshake-overview/)
- [Moz: HTTP Status Codes](https://moz.com/learn/seo/http-status-codes)
- [NGINX: What Is Load Balancing](https://www.nginx.com/resources/glossary/load-balancing/)
- [NGINX: What Is an Application Server vs. a Web Server?](https://www.nginx.com/resources/glossary/application-server-vs-web-server/)
- [phoenixNAP: What Is a Database Server & What Is It Used For?](https://phoenixnap.com/kb/what-is-a-database-server)
