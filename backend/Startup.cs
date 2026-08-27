using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Grafana.OpenTelemetry;  
using OpenTelemetry.Metrics;  
using OpenTelemetry.Trace; 

namespace SampleApi
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddCors(options => options.AddPolicy("Frontend", builder => builder
                // The UI normally uses the same HTTPS origin through nginx. This also
                // permits browser testing from an EC2 hostname/IP or local direct UI.
                .SetIsOriginAllowed(origin => origin.StartsWith("http://") || origin.StartsWith("https://"))
                .AllowAnyHeader()
                .AllowAnyMethod()));
        
            services.AddOpenTelemetry()  
                .WithTracing(configure => configure.UseGrafana())  
                .WithMetrics(configure => configure.UseGrafana());  
        }  
	public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment()) app.UseDeveloperExceptionPage();

            app.UseRouting();
            app.UseCors("Frontend");
            app.UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
