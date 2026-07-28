---
layout: post
title: "Uploading files to Azure VMs using Azure Bastion"
date: 2023-11-12 12:17:11 +0000
categories:
  - "Uncategorized"
tags:
  - "azure"
  - "bastion"
  - "file transfer"
  - "landing zones"
  - "network"
  - "ssh"
redirect_from:
  - "/2023/11/12/uploading-files-to-azure-vms-using-azure-bastion/"
---

<p>Hello there!</p>

<p>Recently, I was working on an Azure project and one of my tasks involved a step where I had to upload some files to a Linux virtual machine. However, the environment was locked down and I did not have direct SSH access to the VM. The only option for remote access was this cool service called "Azure Bastion". You probably already know what it does but in case you don't, you can<a href="https://azure.microsoft.com/en-us/products/azure-bastion"> read more about this fully managed RDP/SSH solution</a>.</p>

<p>So, during my research what would be the quickest approach to perform this upload, I first thought that I could upload the file to a remote cloud storage e.g. OneDrive or even an Azure Storage Account. But, I didn't want to involve more services and at some point <a href="https://azure.microsoft.com/en-us/updates/azure-bastion-file-transfer-native-client/">this post </a>flashed into my mind which says that Azure Bastion supports file uploads with its "Native Client Support" feature. </p>

<p>I though "Great, I already use Bastion!" What about the prerequisites? Easy stuff:</p>

<ul>
<li>Azure CLI &gt;= 2.32</li>

<li>The VM resource ID</li>
</ul>

<p>Keep reading to find out how you can try this by yourself.</p>

<p>What you will need is of course a Bastion, a Linux VM and some Virtual Networks. If you have none of these, go to Azure Quickstart Templates and deploy <a href="https://learn.microsoft.com/en-us/samples/azure/azure-quickstart-templates/bastion-hub-spoke-vnet/">this template</a> by clicking on "Deploy to Azure". Sign in to your Azure Subscription and fill in the template parameters. You will need to define at least the Resource Group along with a username and a password for your VM. Once completed, you should have a Resource Group with the following resources:</p>

<ul>
<li>A hub vnet</li>

<li>A spoke vnet</li>

<li>A bastion host on the Basic tier (you will later need to upgrade to Standard) </li>

<li>A public IP address</li>

<li>A Linux VM with its disk and network interface</li>
</ul>

<p>For the file upload feature to work, your Bastion host must be on the Standard tier and the "Native Client Support" option must be enabled. To do this on the Azure Portal, navigate to your Bastion host resource and under "Settings" select the "Configuration" option. In this page, ensure that the "Standard" tier is selected and the "Native Client Support" box is checked. </p>

<figure class="wp-block-image size-large"><img src="/wp-content/uploads/2023/11/image-1024x674.png" alt="" class="wp-image-247"/></figure>

<p>Click "Apply" to deploy any changes that you made.</p>

<p>Open a Terminal window and run the following commands replacing &lt;subscription id&gt; by the ID of the subscription that contains the Bastion host (not the VM):</p>

<pre class="wp-block-code"><code>az login
az account set -s &lt;subscription id&gt;</code></pre>

<p>Run the following command to create a tunnel between your PC and the VM over the Bastion host, providing the right parameter values for your environment:</p>

<pre class="wp-block-code"><code>az network bastion tunnel --name &lt;bastion name> --resource-group &lt;resource group name> --target-resource-id &lt;VM resourceId> --resource-port &lt;target VM port> --port &lt;local machine port></code></pre>

<ul>
<li><em>bastion name:</em> the name of your Bastion host</li>

<li><em>resource Group name:</em>  the name of the resource group that contains your Bastion host</li>

<li><em>VM resourceId:</em> you can find it in the properties section of your VM in the Azure Portal</li>

<li><em>Target VM port:</em>  it is the port where SSH runs on the targer VM, typically 22.</li>

<li><em>Local machine port:</em> choose a non-reserved TCP port on your PC. You will use it later for the file transfer.</li>
</ul>

<p><strong>Tip:</strong> In case you receive a message that the bastion host was not found, make sure that you are targeting the right Azure Subscription in your Azure CLI session. More specifically, if you are on an environment that uses Azure Landing Zones, most probably your bastion host is deployed in the "Connectivity" subscription but your VM is on an Application Landing Zone. Furthermore, to use the Bastion host, you need to have the "Reader" role on the Bastion host as well as the Virtual Network where it lives.</p>

<p>Once the tunnel is successfully created you will see the message below: </p>

<pre class="wp-block-code"><code>Opening tunnel on port: 59999
Tunnel is ready, connect on port 59999
Ctrl + C to close</code></pre>

<p>Now you can perform the file upload using your favourite SFTP/SCP client. I use WinSCP. To connect to your VM use the following host details:</p>

<p>Host: localhost<br>Port: The local machine port that you provided earlier in the 'az network bastion tunnel' command<br>Username: The VM username<br>Password: The VM password</p>

<figure class="wp-block-image size-full"><img src="/wp-content/uploads/2023/11/image-1.png" alt="" class="wp-image-250"/></figure>

<p>All set! Now you are ready to perform the file upload:</p>

<figure class="wp-block-image size-large"><img src="/wp-content/uploads/2023/11/image-2-1024x291.png" alt="" class="wp-image-251"/></figure>
