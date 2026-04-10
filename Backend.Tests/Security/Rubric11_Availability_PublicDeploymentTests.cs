using System.Net;

namespace Backend.Tests.Security;

/// <summary>
/// IS 414 Security Rubric - Availability (4 pts)
///
/// Confirms the public deployment is reachable on the internet.
/// </summary>
public class Rubric11_Availability_PublicDeploymentTests
{
    [Fact]
    public async Task Public_Site_Base_Url_Returns_200()
    {
        using var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };

        using var response = await client.GetAsync("https://lunas-project.site");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
