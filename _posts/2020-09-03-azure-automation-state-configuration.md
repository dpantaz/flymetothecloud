---
layout: post
title: "Azure Automation State Configuration"
date: 2020-09-03 13:58:15 +0000
categories:
  - "Azure"
  - "DSC"
  - "PowerShell"
redirect_from:
  - "/2020/09/03/azure-automation-state-configuration/"
---

<p>Hello and welcome to my new blog!</p>

<p>In my first post I decided to talk about two technologies which, when combined, can give you a lot of power managing your VMs in the cloud.</p>

<p>First one is PowerShell. Generally, I prefer to use it for my daily tasks. I have also used it a lot in my career, in order to help organizations get rid of long, boring, GUI-driven processes and replace them with code that works every time, with the same result but, most importantly, way faster.<br>Second one is Microsoft Azure. I started working with Azure about two years ago and I can say that it has opened new fields for me enabling rapid and consistent deployments, helping to stay up-to-date and take advantage of the latest and coolest technologies in the IT industry.</p>

<p>So, this one is dedicated to Azure Automation State Configuration. It is a Configuration Management tool that can help you push declarative configurations to your servers, both in the cloud and on-premises, either Windows or Linux. It is based on PowerShell Desired State Configuration (DSC) which became available with PowerShell 4.0 in Windows Server 2012 R2. PowerShell DSC works in two modes, "push" and "pull". In the "push" mode the administrator runs a command that "pushes" a configuration against one or more servers. In the "pull" mode, the administrator uploads all configurations in a central repository called the "pull server". Then, each server contacts the "pull server" on specified intervals to see if there is any new configuration for him to "pull" and apply.</p>

<p>Azure Automation State Configuration offers you a "pull-server-as-a-service", which means that you can upload your configurations to Azure, register your servers to the service and monitor their compliance status through a reporting tool. In order to set things up, you will need the following components:
</p>

<ul><li>an Azure Automation Account</li><li>some DSC code</li><li>your own servers</li></ul>

<p class="has-medium-font-size">Create an Automation Account</p>

<p>Creating an Automation Account is as easy as searching for "automation" in the Azure portal. Choose "Automation Accounts" then click "Create automation account". You will need to specify a name for your automation account, a resource group and a location.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/07/image.png" alt="" class="wp-image-127"/></figure>

<p>You can also create your automation account using the following Azure PowerShell cmdlet:</p>

<pre class="wp-block-code"><code>New-AzAutomationAccount -Name Automation1 -ResourceGroupName rg1 -Location westeurope</code></pre>

<p class="has-medium-font-size">Import a DSC configuration</p>

<p>Now that you have created your Automation Account, it's time to populate with some configurations, that is, the actual PowerShell code. Look for your newly created Automation Account "Automation1" and navigate to "State configuration (DSC) / Configurations" and then click "Add".</p>

<p></p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/09/image.png" alt="" class="wp-image-130"/></figure>

<p>Choose to upload a DSC configuration file from your hard drive and click "OK".</p>

<p></p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/09/image-1.png" alt="" class="wp-image-133"/></figure>

<p>There are already tons of configuration files available on the Internet. You can grab a very basic one from <a href="https://github.com/dpantaz/AzureStateConfiguration/blob/master/IISConfig.ps1">my Github page</a>.</p>

<p>You can also import a configuration file using Azure PowerShell.</p>

<pre class="wp-block-code"><code>Import-AzAutomationDscConfiguration -AutomationAccountName "Automation1" -ResourceGroupName "rg1" -SourcePath ".\IISConfig.ps1" -Published</code></pre>

<p>Next step is to compile your configuration. Back in the Azure Portal, on the "Configurations" tab, choose your configuration and in the next window click "Compile".</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/09/image-3.png" alt="" class="wp-image-136"/></figure>

<p>To achieve this with Azure PowerShell just run the following cmdlet:</p>

<pre class="wp-block-code"><code>Start-AzAutomationDscCompilationJob -ConfigurationName IISConfig -ResourceGroupName rg1 -AutomationAccountName Automation1</code></pre>

<p>Now that our code is ready, it is time to assign the configuration to our server. For this purpose I have already created an Azure VM called "vm1".<br>In the "State Configuration (DSC) blade, navigate to "Nodes" and click "Add". </p>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-4.png" alt="" class="wp-image-137" width="516" height="388"/></figure>

<p> Choose your VM from the list and click "Connect".<br></p>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-5.png" alt="" class="wp-image-138" width="491" height="266"/></figure>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-7.png" alt="" class="wp-image-140" width="196" height="393"/></figure>

<p>In the last window, you can make a few choices such as:</p>

<ul><li><strong>Node configuration name</strong>: We will choose "IISConfig.IsWebServer" which refers to the part of our PowerShell code that installs IIS on our Windows Server.</li><li><strong>Refresh Frequency</strong>: Refers to how often the VM checks for new configurations. Default is 30 minutes.</li><li><strong>Configuration Mode</strong>: You can choose how to apply the configuration to your server. We choose "ApplyAndMonitor".</li><li><strong>Configuration Mode Frequency</strong>: It specifies how often the "Configuration Mode" is applied. Works only with " ApplyAndAutoCorrect" and "ApplyAndMonitor". Default is 15 minutes.</li></ul>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-8.png" alt="" class="wp-image-142" width="334" height="753"/></figure>

<p>Apart from using Azure Portal, you can also register your VMs as DSC nodes using the following Azure PowerShell cmdlet:</p>

<pre class="wp-block-code"><code>Register-AzAutomationDscNode -AutomationAccountName Automation1 -AzureVMName vm1 -ResourceGroupName rg1 -NodeConfigurationName "IISConfig.IsWebServer" -ConfigurationMode ApplyAndMonitor -RefreshFrequencyMins 30 -ConfigurationModeFrequencyMins 15</code></pre>

<p>Once you click OK, the "Microsoft.Powershell.DSC" extension will be installed to your VM. As soon as the registration process is completed, the configuration will be applied to your server. In our case, IIS will be installed. You can confirm that by checking IIS installation status on your VM.</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/09/image-9.png" alt="" class="wp-image-143"/></figure>

<p>You can also use Azure Portal to ensure that your nodes are compliant with the assigned configurations.</p>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-10-1024x426.png" alt="" class="wp-image-144" width="887" height="369"/></figure>

<p>As a last step, I will show you what happens if IIS gets uninstalled from the server. First, let's remove the role using Windows PowerShell</p>

<figure class="wp-block-image"><img src="/wp-content/uploads/2020/09/image-11.png" alt="" class="wp-image-146"/></figure>

<p>Now let's go to Azure Portal, "State Configuration (DSC)" blade.</p>

<figure class="wp-block-image is-resized"><img src="/wp-content/uploads/2020/09/image-12.png" alt="" class="wp-image-147" width="608" height="344"/></figure>

<p>Your VM now appears as "Not compliant" with the assigned configuration. Remember that during node registration, we chose "ApplyAndMonitor" as the configuration mode. This means that configuration was applied only once, during the initial registration. </p>

<p>Had we opted for "ApplyAndAutoCorrect", the DSC mechanism would have reinstalled IIS, ensuring that our server always stays compliant with the configuration.</p>
