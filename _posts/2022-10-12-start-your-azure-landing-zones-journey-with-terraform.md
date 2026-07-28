---
layout: post
title: "Start your Azure Landing Zones journey with Terraform"
date: 2022-10-12 11:45:47 +0000
categories:
  - "Uncategorized"
tags:
  - "automation"
  - "azure"
  - "iac"
  - "landing zones"
  - "terraform"
image: "/wp-content/uploads/2022/10/Screenshot-2022-10-10-162951-1-1024x803.png"
summary: "Find out how to initialize your Azure environment with documented best practices leveraging IaC benefits"
redirect_from:
  - "/2022/10/12/start-your-azure-landing-zones-journey-with-terraform/"
---

<p>Managing an Azure environment can require a lot of effort, especially for large enterprises. Microsoft has released its own guidelines and recommendations around this topic in the <a rel="noreferrer noopener" aria-label="Azure Landing Zones conceptual architecture (opens in a new tab)" href="https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/#azure-landing-zone-conceptual-architecture" target="_blank">Azure Landing Zones conceptual architecture</a>, part of the Cloud Adoption Framework. It provides an opinionated approach on deploying and managing the foundations of an organization's Azure estate, based on all the lessons learned by Microsoft and its partners after all these years of experience.</p>

<p>The good news is that you can easily benefit from this and start applying all these best practices on your own Azure environment today! Microsoft provides the following three implementation options for Azure Landing Zones:</p>

<ul><li>Portal Accelerator (GUI-driven)</li><li>Bicep module (automation-friendly)</li><li>Terraform module (automation-friendly)</li></ul>

<p>As you might have guessed, this blog and its author love automation, therefore we will not focus on bullet #1 (although you can read about it at the <a rel="noreferrer noopener" aria-label="Deploy Enterprise-Scale foundation page on GitHub (opens in a new tab)" href="https://github.com/Azure/Enterprise-Scale/blob/main/docs/reference/wingtip/README.md" target="_blank">Deploy Enterprise-Scale foundation page on GitHub</a>). So, we are left with options #2 and #3. For this post we will work with the Terraform option.</p>

<p>Before we dig deeper, let's make sure that you are familiar with the concepts of Terraform. Terraform is one of the most popular Infrastructure-as-Code languages, that can help you deploy and configure your infrastructure using declarative code syntax. It can work with all major public cloud providers as well as many on-premises platforms. There is <a rel="noreferrer noopener" aria-label="a nice tutorial at Hashicorp Learn (opens in a new tab)" href="https://learn.hashicorp.com/collections/terraform/azure-get-started" target="_blank">a nice tutorial at Hashicorp Learn</a> that can teach you all the basics for Terraform on Azure in less than an hour. </p>

<p>Back to our main topic, Microsoft provides the <a href="https://github.com/Azure/terraform-azurerm-caf-enterprise-scale" target="_blank" rel="noreferrer noopener" aria-label="Azure Landing Zones Enterprise Scale Terraform module (opens in a new tab)">Azure Landing Zones Enterprise Scale Terraform module</a>, which can help us quickly deploy the foundations of our Azure environment, such as management groups, policies, role assignments, networking, logging and security. To start, make sure that your workstation has all the necessary tools installed such as:</p>

<ul><li>Your favorite editor (e.g. <a rel="noreferrer noopener" aria-label="VSCode (opens in a new tab)" href="https://code.visualstudio.com/download" target="_blank">VSCode</a>)</li><li><a rel="noreferrer noopener" aria-label="Azure CLI (opens in a new tab)" href="https://learn.microsoft.com/en-us/cli/azure/install-azure-cli" target="_blank">Azure CLI</a></li><li><a href="https://learn.hashicorp.com/tutorials/terraform/install-cli" target="_blank" rel="noreferrer noopener" aria-label="Terraform (opens in a new tab)">Terraform</a> </li></ul>

<p>Launch VSCode and create a new folder e.g. "ALZ". Next, create a new file "main.tf." and type the following code:</p>

<pre class="wp-block-code"><code>terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0.2"
    }
  }
}

<p>provider "azurerm" {<br>
  features {}<br>
}</p>

<p>data "azurerm_client_config" "core" {}</p>

<p>module "enterprise_scale" {<br>
  source  = "Azure/caf-enterprise-scale/azurerm"<br>
  version = "2.4.1"</p>

<p>providers = {<br>
    azurerm              = azurerm<br>
    azurerm.connectivity = azurerm<br>
    azurerm.management   = azurerm<br>
  }</p>

<p>root_parent_id = data.azurerm_client_config.core.tenant_id<br>
  root_id        = ""<br>
  root_name      = ""</p>

<p>}</code></pre></p>

<p>Make sure to give root_id and root_name values that are suitable to your organization. For example, if you work for the "FlyMeToTheCloud" company, you can set it to something like:</p>

<pre class="wp-block-code"><code>  root_id        = "Fly"
  root_name      = "FlyMeToTheCloud"</code></pre>

<p>On VSCode open a terminal and make sure that you cd to the directory that contains your main.tf file. Then, type "az login" to connect to your Azure tenant.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-10-162951-1-1024x803.png" alt="" class="wp-image-226"/></figure>

<p>Now, run "terraform init" to initialize Terraform for the new configuration.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-10-163510-1024x805.png" alt="" class="wp-image-227"/></figure>

<p>Next, run "terraform plan" to preview the changes that the new configuration would apply to Azure. Take a look to the output of this command. In this case, 183 new resources will be created in Azure. This is expected. You can scroll up in the terminal window to review the detailed list of what will be deployed.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-10-163640-1024x805.png" alt="" class="wp-image-228"/></figure>

<p>Finally, run "terraform apply" to deploy the changes to Azure. When asked, type yes to approve the planned changes. Once completed, review the number of resources that have been deployed to Azure.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-12-125156-1024x808.png" alt="" class="wp-image-232"/></figure>

<p>Navigate to the Azure Portal and review the applied changes. For example, open the Management Groups page and review the new management groups. Note that there is a new MG called "FlyMeToTheCloud" with the ID "Fly". This is the "Intermediate Root" MG.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-12-130200-1024x779.png" alt="" class="wp-image-233"/></figure>

<p>You can also review the policy assignments created by our deployment. On the Azure Portal, navigate to "Policy", click "Assignments" and set the "Scope" to the Intermediate Root MG which in our case is "FlyMeToTheCloud". You can have a look at all the actual policies assigned at the <a href="https://github.com/Azure/Enterprise-Scale/blob/main/docs/ESLZ-Policies.md">dedicated page on GitHub</a>.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2022/10/Screenshot-2022-10-12-131530-1024x772.png" alt="" class="wp-image-234"/></figure>

<p>The above changes should not produce any charges to your Azure subscriptions. After all, we just created some management groups and applied a few policies, which are all provided for free. Furthermore, these should not impact any resources (e.g. Virtual Machines) that you might have already created, since we did not move any subscriptions under these MGs. We will discuss this point in a future post.</p>
