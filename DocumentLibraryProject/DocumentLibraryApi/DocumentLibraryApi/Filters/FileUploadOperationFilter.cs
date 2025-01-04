using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace DocumentLibraryApi.Filters
{
    public class FileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Iterate through the parameters for the endpoint
            foreach (var parameter in context.ApiDescription.ParameterDescriptions)
            {
                // If a parameter is of type IFormFile, define it as a file upload
                if (parameter.ParameterDescriptor.ParameterType == typeof(IFormFile))
                {
                    var fileParam = operation.Parameters.FirstOrDefault(p => p.Name == parameter.Name);
                    if (fileParam != null)
                    {
                        fileParam.Schema = new OpenApiSchema
                        {
                            Type = "string",
                            Format = "binary"
                        };
                        fileParam.Description = "The file to be uploaded";
                    }
                }
            }
        }
    }
}
