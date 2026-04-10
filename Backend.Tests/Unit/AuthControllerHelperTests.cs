using System.Reflection;
using Backend.Controllers;
using Backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests.Unit;

public class AuthControllerHelperTests
{
    [Theory]
    [InlineData(null, "/dashboard")]
    [InlineData("", "/dashboard")]
    [InlineData("dashboard", "/dashboard")]
    [InlineData("/resident/12", "/resident/12")]
    public void NormalizeReturnPath_HandlesExpectedCases(string? input, string expected)
    {
        var method = typeof(AuthController).GetMethod("NormalizeReturnPath", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        var result = (string?)method!.Invoke(null, [input]);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void BuildFrontendSuccessUrl_UsesConfiguredFrontendAndNormalizedPath()
    {
        var controller = CreateController(new Dictionary<string, string?>
        {
            ["FrontendUrl"] = "https://ui.test.local/"
        });

        var method = typeof(AuthController).GetMethod("BuildFrontendSuccessUrl", BindingFlags.NonPublic | BindingFlags.Instance);
        Assert.NotNull(method);

        var result = (string?)method!.Invoke(controller, ["not-a-path"]);

        Assert.Equal("https://ui.test.local/dashboard", result);
    }

    [Fact]
    public void BuildFrontendErrorUrl_BuildsLoginUrlWithEncodedErrorQuery()
    {
        var controller = CreateController(new Dictionary<string, string?>
        {
            ["FrontendUrl"] = "https://ui.test.local"
        });

        var method = typeof(AuthController).GetMethod("BuildFrontendErrorUrl", BindingFlags.NonPublic | BindingFlags.Instance);
        Assert.NotNull(method);

        var result = (string?)method!.Invoke(controller, ["External login failed."]);

        Assert.NotNull(result);
        Assert.Contains("https://ui.test.local/login", result);
        Assert.Contains("externalError=External%20login%20failed.", result);
    }

    private static AuthController CreateController(Dictionary<string, string?> configValues)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        return new AuthController(
            userManager: null!,
            signInManager: null!,
            configuration: config,
            db: null!);
    }
}
